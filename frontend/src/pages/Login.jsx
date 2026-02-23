import { Building2 } from "lucide-react";
import { useAuth } from "../lib/auth/AuthProvider";

export default function Login() {
  const { login, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/20 mb-4">
            <Building2 className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-manrope">DomusVita</h1>
          <p className="text-slate-500 mt-1">Immobilienverwaltung</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">Willkommen</h2>
          <p className="text-sm text-slate-500 text-center mb-8">
            Melden Sie sich mit Ihrem Microsoft-Konto an, um fortzufahren.
          </p>

          <button
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Wird angemeldet...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                <span>Mit Microsoft anmelden</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center mt-6">
          DomusVita Gesundheit &middot; 300&VIER GmbH
        </p>
      </div>
    </div>
  );
}
