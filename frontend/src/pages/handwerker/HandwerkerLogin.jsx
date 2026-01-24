import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Wrench, LogIn, Loader2, QrCode, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HandwerkerLogin() {
  const navigate = useNavigate();
  const [handwerkerId, setHandwerkerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [handwerkerList, setHandwerkerList] = useState([]);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("handwerker_token");
    if (token) {
      verifyToken(token);
    }
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/handwerker-sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch((err) => console.log('SW registration failed:', err));
    }
    
    // Fetch available handwerker for demo
    fetchHandwerker();
  }, []);

  const verifyToken = async (token) => {
    try {
      const res = await axios.get(`${API}/handwerker/verify/${token}`);
      if (res.data.valid) {
        localStorage.setItem("handwerker_id", res.data.handwerker_id);
        localStorage.setItem("handwerker_name", res.data.name);
        navigate("/handwerker/tickets");
      }
    } catch (error) {
      localStorage.removeItem("handwerker_token");
    }
  };

  const fetchHandwerker = async () => {
    try {
      const res = await axios.get(`${API}/contacts?role=Handwerker`);
      setHandwerkerList(res.data);
    } catch (error) {
      console.error("Error fetching handwerker:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!handwerkerId.trim()) {
      setError("Bitte geben Sie Ihre Handwerker-ID ein");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/handwerker/login`, {
        handwerker_id: handwerkerId.trim()
      });

      if (res.data.success) {
        localStorage.setItem("handwerker_token", res.data.token);
        localStorage.setItem("handwerker_id", res.data.handwerker_id);
        localStorage.setItem("handwerker_name", res.data.name);
        toast.success(`Willkommen, ${res.data.name}!`);
        navigate("/handwerker/tickets");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Ungültige Handwerker-ID. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (id) => {
    setHandwerkerId(id);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col" data-testid="handwerker-login">
      {/* Header */}
      <div className="p-6 text-center border-b border-white/10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 mb-4">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white font-['Manrope']">DomusVita</h1>
        <p className="text-white/50 text-sm mt-1">Handwerker Portal</p>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white font-['Manrope']">Anmelden</h2>
            <p className="text-white/50 text-sm mt-2">
              Geben Sie Ihre Handwerker-ID ein oder scannen Sie den QR-Code
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                value={handwerkerId}
                onChange={(e) => setHandwerkerId(e.target.value)}
                placeholder="Handwerker-ID eingeben"
                className="h-14 text-center text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                data-testid="handwerker-id-input"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all active:scale-[0.98]"
              data-testid="login-button"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Anmelden
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#050505] px-2 text-white/40">oder</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-14 text-lg rounded-xl bg-white/5 border-white/20 text-white hover:bg-white/10"
            disabled
          >
            <QrCode className="w-5 h-5 mr-2" />
            QR-Code scannen
          </Button>

          {/* Demo Quick Login */}
          {handwerkerList.length > 0 && (
            <div className="space-y-3 pt-4">
              <p className="text-xs text-white/40 text-center uppercase">Demo: Schnellanmeldung</p>
              <div className="space-y-2">
                {handwerkerList.slice(0, 3).map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleQuickLogin(h.id)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all"
                    data-testid={`quick-login-${h.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                        {h.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{h.name}</p>
                        <p className="text-white/50 text-sm">{h.specialty || "Handwerker"}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center border-t border-white/10">
        <p className="text-xs text-white/30">
          © 2025 DomusVita • Handwerker Mobile Portal
        </p>
      </div>
    </div>
  );
}
