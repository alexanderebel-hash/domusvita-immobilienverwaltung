import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Wrench,
  FolderOpen,
  Settings,
  Sparkles,
  Heart,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Immobilien", path: "/immobilien", icon: Building2 },
  { name: "Kontakte", path: "/kontakte", icon: Users },
  { name: "Verträge", path: "/vertraege", icon: FileText },
  { name: "Instandhaltung", path: "/instandhaltung", icon: Wrench },
  { name: "Dokumente", path: "/dokumente", icon: FolderOpen },
];

const pflegeItems = [
  { name: "Pflege-WGs", path: "/pflege-wgs", icon: Heart },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside 
      className="fixed left-0 top-0 h-full w-64 glass-sidebar z-50 flex flex-col"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-['Manrope']">DomusVita</h1>
            <p className="text-xs text-white/50">Immobilienverwaltung</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Hauptnavigation */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          if (item.disabled) {
            return null; // No disabled items anymore
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              data-testid={`nav-${item.name.toLowerCase()}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-white/10 text-white border-r-2 border-blue-500"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          );
        })}
        
        {/* Pflege-WGs Sektion */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <p className="px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Klientenmanagement
          </p>
          {pflegeItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                data-testid={`nav-${item.name.toLowerCase().replace('-', '')}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border-r-2 border-pink-500"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-pink-400' : ''}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* AI Assistant Teaser */}
      <div className="p-4 border-t border-white/10">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/10 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">KI-Assistent</span>
          </div>
          <p className="text-xs text-white/60 mb-3">
            Fragen Sie mich zu Ihren Immobilien
          </p>
          <button 
            className="w-full text-xs py-2 px-3 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all"
            data-testid="ai-assistant-button"
          >
            Chat starten
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-white/10">
        <button 
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
          data-testid="settings-button"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Einstellungen</span>
        </button>
      </div>
    </aside>
  );
}
