import { PublicClientApplication, BrowserCacheLocation } from "@azure/msal-browser";

// Default config - will be updated from backend
let msalConfig = {
  auth: {
    clientId: "",
    authority: "",
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (process.env.NODE_ENV === "development") {
          console.log(`[MSAL] ${message}`);
        }
      },
      logLevel: "Warning",
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

export let msalInstance = null;

export const initializeMsal = async () => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  try {
    // Fetch auth config from backend
    const response = await fetch(`${BACKEND_URL}/api/auth/config`);
    const config = await response.json();

    msalConfig.auth.clientId = config.clientId;
    msalConfig.auth.authority = config.authority;

    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    // Handle redirect response (non-fatal if no redirect in progress)
    try {
      const response2 = await msalInstance.handleRedirectPromise();
      if (response2) {
        msalInstance.setActiveAccount(response2.account);
      }
    } catch (redirectError) {
      console.debug("handleRedirectPromise:", redirectError.errorCode || redirectError.message);
    }

    // Set active account if exists
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }

    return msalInstance;
  } catch (error) {
    console.error("MSAL initialization failed:", error);
    throw error;
  }
};

export const getAccessToken = async () => {
  if (!msalInstance) {
    throw new Error("MSAL not initialized");
  }

  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw new Error("No active account");
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    // Use ID token (audience = our client ID) instead of access token
    return response.idToken;
  } catch (error) {
    console.warn("Silent token acquisition failed:", error);
    throw error;
  }
};

export const logout = async () => {
  if (!msalInstance) return;

  await msalInstance.logoutRedirect({
    postLogoutRedirectUri: window.location.origin,
  });
};
