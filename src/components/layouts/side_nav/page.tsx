import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, FolderOpen, LayoutDashboard, Settings, Shield, Zap } from "lucide-react";
import { getCurrentUserEmail, getCurrentUserFullName, isAdmin, logout } from "../../../util/auth";
import ThemeToggle, {
  type DashboardTheme,
} from "../dashboard_layout/ThemeToggle";

interface SideNavProps {
  onNavClick?: () => void;
  onToggleTheme: () => void;
  theme: DashboardTheme;
}

const SideNav = ({ onNavClick, onToggleTheme, theme }: SideNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const admin = isAdmin();
  const getActiveId = () => {
    if (currentPath.includes("/projects")) return "projects";
    if (currentPath.includes("/deployments")) return "deployments";
    if (currentPath.includes("/billing")) return "billing";
    if (currentPath.includes("/admin/users")) return "user-management";
    if (currentPath.includes("/settings")) return "settings";
    return "dashboard";
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "projects", label: "Projects", icon: FolderOpen, path: "/dashboard/projects" },
    { id: "deployments", label: "Deployments", icon: Zap, path: "/dashboard/deployments" },
    { id: "billing", label: "Billing", icon: CreditCard, path: "/dashboard/billing" },
    ...(admin
      ? [{ id: "user-management", label: "User Management", icon: Shield, path: "/dashboard/admin/users" }]
      : []),
    { id: "settings", label: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  const handleNavClick = (_id: string, path: string) => {
    navigate(path);
    onNavClick?.();
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-header">
        <img
          src="/transparent-logo.png"
          alt="Shiply"
          className="mb-2 h-16 w-auto sm:h-20"
        />
        <p className="app-kicker">
          Hosting Platform
        </p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
        {navItems.map(({ id, label, icon: Icon, path }) => (
          <button
            type="button"
            key={id}
            onClick={() => handleNavClick(id, path)}
            className={`app-nav-button ${
              getActiveId() === id
                ? "app-nav-button-active"
                : ""
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="app-sidebar-footer space-y-3">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <button
          type="button"
          className="app-nav-button"
          onClick={() => handleNavClick("settings", "/dashboard/settings")}
        >
          <Settings size={20} />
          <span>Preferences</span>
        </button>

        <div className="app-user-card">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] app-muted">
            Logged in as
          </p>
          <p className="mt-1 text-sm font-semibold">
            {getCurrentUserFullName() || "Shiply User"}
          </p>
          <p className="mt-1 break-all text-sm font-semibold">
            {getCurrentUserEmail()}
          </p>
        </div>

        <button
          type="button"
          className="app-button-danger w-full"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default SideNav;
