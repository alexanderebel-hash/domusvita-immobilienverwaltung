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
  X,
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

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 glass-sidebar z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      data-testid="sidebar"
    >
      {/* Logo + Close */}
      <div className="p-5 border-b border-gray-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">DomusVita</h1>
              <p className="text-[11px] text-gray-400 font-medium">Immobilienverwaltung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            data-testid="close-sidebar-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              data-testid={`nav-${item.name.toLowerCase()}`}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? "text-blue-500" : ""}`} />
              <span className="text-[13.5px]">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Pflege-WGs */}
        <div className="pt-4 mt-3 border-t border-gray-200/60">
          <p className="px-3.5 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Klientenmanagement
          </p>
          {pflegeItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                data-testid={`nav-${item.name.toLowerCase().replace("-", "")}`}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-pink-50 text-pink-600 font-medium"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-pink-500" : ""}`} />
                <span className="text-[13.5px]">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* AI Assistant */}
      <div className="p-3 border-t border-gray-200/60">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/60">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-[13px] font-semibold text-gray-800">KI-Assistent</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2.5">
            Fragen Sie mich zu Ihren Immobilien
          </p>
          <button
            className="w-full text-[12px] py-2 px-3 rounded-xl bg-white/80 text-blue-600 font-medium hover:bg-white transition-all border border-blue-100/60 shadow-sm"
            data-testid="ai-assistant-button"
          >
            Chat starten
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-gray-200/60">
        <button
          className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/70 transition-all"
          data-testid="settings-button"
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="text-[13.5px]">Einstellungen</span>
        </button>
      </div>
    </aside>
  );
}
