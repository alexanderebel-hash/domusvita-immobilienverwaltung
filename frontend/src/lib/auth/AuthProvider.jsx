import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { msalInstance, loginRequest, getAccessToken, logout as msalLogout, initializeMsal } from "./msalConfig";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Dev Mode Provider - No MSAL required
const DevModeProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const devLogin = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/dev-login`);
      setUser(response.data);
      setIsAuthenticated(true);
      sessionStorage.setItem("dev_user", JSON.stringify(response.data));
    } catch (err) {
      console.error("Dev login failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("dev_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      // Auto-login in dev mode
      devLogin();
    }
  }, [devLogin]);

  const login = async () => {
    await devLogin();
  };

  const logout = async () => {
    sessionStorage.removeItem("dev_user");
    setUser(null);
    setIsAuthenticated(false);
  };

  const getToken = async () => {
    return "dev-mode-token";
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getAccessToken: getToken,
    devMode: true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Production Mode Provider - Uses MSAL
const AuthProviderInner = ({ children }) => {
  const { instance, inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/profile`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(response.data);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (inProgress === InteractionStatus.None) {
        if (isAuthenticated && accounts.length > 0) {
          await fetchUserProfile();
        }
        setLoading(false);
      }
    };

    initAuth();
  }, [isAuthenticated, inProgress, accounts, fetchUserProfile]);

  const login = async () => {
    try {
      setLoading(true);
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Login failed:", err);
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  };

  const value = {
    user,
    isAuthenticated,
    loading: loading || inProgress !== InteractionStatus.None,
    login,
    logout,
    getAccessToken,
    devMode: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Main AuthProvider - checks dev mode and chooses provider
export const AuthProvider = ({ children }) => {
  const [devMode, setDevMode] = useState(null);
  const [msalReady, setMsalReady] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const checkDevMode = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/config`);
        const config = await response.json();
        setDevMode(config.devMode === true);

        if (!config.devMode) {
          try {
            await initializeMsal();
            setMsalReady(true);
          } catch (err) {
            console.error("MSAL init error:", err);
            setInitError(err.message);
          }
        }
      } catch (err) {
        console.error("Failed to check dev mode:", err);
        // Default to dev mode if backend unavailable
        setDevMode(true);
      }
    };

    checkDevMode();
  }, []);

  // Set up global axios interceptor for existing axios.get() calls
  useEffect(() => {
    if (devMode === false && msalReady) {
      const interceptorId = axios.interceptors.request.use(
        async (config) => {
          try {
            const token = await getAccessToken();
            if (token) config.headers.Authorization = `Bearer ${token}`;
          } catch (e) {
            /* silent */
          }
          return config;
        },
        (error) => Promise.reject(error)
      );
      return () => axios.interceptors.request.eject(interceptorId);
    } else if (devMode === true) {
      const interceptorId = axios.interceptors.request.use(
        async (config) => {
          config.headers.Authorization = "Bearer dev-mode-token";
          return config;
        },
        (error) => Promise.reject(error)
      );
      return () => axios.interceptors.request.eject(interceptorId);
    }
  }, [devMode, msalReady]);

  // Loading state
  if (devMode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Initialisiere...</p>
        </div>
      </div>
    );
  }

  // Dev Mode
  if (devMode) {
    return <DevModeProvider>{children}</DevModeProvider>;
  }

  // Production Mode - MSAL
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">Authentifizierung konnte nicht initialisiert werden</p>
          <p className="text-slate-500 text-sm">{initError}</p>
        </div>
      </div>
    );
  }

  if (!msalReady || !msalInstance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Initialisiere MSAL...</p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </MsalProvider>
  );
};

export default AuthProvider;
