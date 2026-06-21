import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import SideNav from "../side_nav/page";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./user_pages/Dashboard";
import Billing from "./user_pages/Billing";
import Deployments from "./user_pages/Deployments";
import Projects from "./user_pages/Projects";
import ManageProject from "./user_pages/ManageProject";
import NewServicePage from "./user_pages/NewServicePage";
import SettingsPage from "./user_pages/Settings";
import UserManagementPage from "./user_pages/UserManagement";
import ThemeToggle, { type DashboardTheme } from "./ThemeToggle";
import ProtectedRoute from "../../protectedRoutes/page";

const DASHBOARD_THEME_STORAGE_KEY = "shiply-dashboard-theme";

const getInitialTheme = (): DashboardTheme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const UserLayout = () => {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<DashboardTheme>(() => getInitialTheme());

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <div className="authenticated-app" data-theme={theme}>
      <div className="flex h-screen overflow-hidden">
        {open && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: "var(--app-overlay)" }}
            onClick={() => setOpen(false)}
          />
        )}

        <div
          className={`
            fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out
            ${open ? "translate-x-0" : "-translate-x-full"}
            md:static md:translate-x-0
          `}
        >
          <SideNav
            onNavClick={() => setOpen(false)}
            onToggleTheme={toggleTheme}
            theme={theme}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="app-mobile-header">
            <div className="app-mobile-brand">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="app-icon-button"
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
              <img
                src="/transparent-logo.png"
                alt="Shiply"
                className="h-8 w-auto flex-shrink-0"
              />
            </div>
            <ThemeToggle compact theme={theme} onToggle={toggleTheme} />
          </header>

          <main className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:projectId" element={<ManageProject />} />
              <Route
                path="projects/:projectId/new-service"
                element={<NewServicePage />}
              />
              <Route path="deployments" element={<Deployments />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="admin/users"
                element={(
                  <ProtectedRoute requiredRole="ADMIN">
                    <UserManagementPage />
                  </ProtectedRoute>
                )}
              />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
