import { useLocation } from "react-router-dom";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth/AuthProvider";

const pageTitles = {
  "/": "Dashboard",
  "/immobilien": "Immobilien",
  "/kontakte": "Kontakte",
  "/vertraege": "Verträge",
  "/instandhaltung": "Instandhaltung",
  "/dokumente": "Dokumente",
  "/pflege-wgs": "Pflege-WGs",
};

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];
    if (location.pathname.startsWith("/immobilien/")) return "Immobilie Details";
    if (location.pathname.startsWith("/pflege-wgs/")) return "Pflege-WG Details";
    return "DomusVita";
  };

  const getInitials = () => {
    if (!user?.name) return "?";
    const parts = user.name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4 md:px-6">
      {/* Left: Mobile menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div className="lg:hidden flex items-center gap-2">
          <span className="text-lg font-semibold text-slate-900 font-manrope">DomusVita</span>
        </div>
        <h1 className="hidden lg:block text-lg font-semibold text-slate-900 font-manrope">
          {getTitle()}
        </h1>
      </div>

      {/* Right: Search + Notifications + User + Logout */}
      <div className="flex items-center gap-3">
        {/* Search - Desktop only */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Suchen..."
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
          />
        </div>

        {/* Notifications */}
        <button className="p-2 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors relative">
          <Bell className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Avatar + Name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-sm font-medium">
            {getInitials()}
          </div>
          <span className="hidden md:block text-sm text-slate-600 max-w-[120px] truncate">
            {user?.name || "Benutzer"}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          title="Abmelden"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
