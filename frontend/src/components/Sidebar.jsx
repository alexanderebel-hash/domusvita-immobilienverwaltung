import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Wrench,
  FolderOpen,
  Heart,
  X,
  BarChart3,
  ExternalLink,
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
      className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      data-testid="sidebar"
    >
      {/* Logo + Close */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://www.domusvita-portal.de/logo.png"
              alt="DomusVita"
              className="w-10 h-10 rounded-xl"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 items-center justify-center shadow-md shadow-cyan-500/20 hidden"
            >
              <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 font-manrope">DomusVita</h1>
              <p className="text-[11px] text-slate-400 font-medium">Immobilienverwaltung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            data-testid="close-sidebar-btn"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Verwaltung
        </p>
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
                  ? "bg-cyan-50 text-cyan-700 font-medium border border-cyan-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? "text-cyan-600" : ""}`} strokeWidth={1.5} />
              <span className="text-[13.5px]">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Klientenmanagement */}
        <div className="pt-4 mt-3 border-t border-slate-200">
          <p className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    ? "bg-cyan-50 text-cyan-700 font-medium border border-cyan-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-cyan-600" : ""}`} strokeWidth={1.5} />
                <span className="text-[13.5px]">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Weitere Module */}
        <div className="pt-4 mt-3 border-t border-slate-200">
          <p className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Weitere Module
          </p>
          <a
            href="https://controlling.domusvita-portal.de"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          >
            <BarChart3 className="w-[18px] h-[18px]" strokeWidth={1.5} />
            <span className="text-[13.5px]">Controlling</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" strokeWidth={1.5} />
          </a>
        </div>
      </nav>
    </aside>
  );
}
