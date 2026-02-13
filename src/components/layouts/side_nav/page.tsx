import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Zap, CreditCard, Settings } from 'lucide-react';
import { logout } from '../../../util/auth';

interface SideNavProps {
  onNavClick?: () => void;
}

const SideNav = ({ onNavClick }: SideNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the current path and set active state
  const currentPath = location.pathname;
  const getActiveId = () => {
    if (currentPath.includes('/projects')) return 'projects';
    if (currentPath.includes('/deployments')) return 'deployments';
    if (currentPath.includes('/billing')) return 'billing';
    if (currentPath.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  const [active, setActive] = useState(getActiveId());

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, path: '/dashboard/projects' },
    { id: 'deployments', label: 'Deployments', icon: Zap, path: '/dashboard/deployments' },
    { id: 'billing', label: 'Billing', icon: CreditCard, path: '/dashboard/billing' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  const handleNavClick = (id: string, path: string) => {
    setActive(id);
    navigate(path);
    onNavClick?.();
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className="h-screen w-64 bg-slate-950 text-white border-r border-slate-800 overflow-y-auto flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 p-6">
        <img
          src="public/transparent-logo.png"
          alt="Shiply"
          className="h-20 w-auto mb-2"
        />
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
          Hosting Platform
        </p>
      </div>
      {/* Scrollable Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon, path }) => (
          <button
            key={id}
            onClick={() => handleNavClick(id, path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 font-medium bg-slate-800 ${
              active === id
                ? 'bg-slate-800 text-white border-l-2 border-slate-400 hover:bg-slate-700'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
        {/* filler to test scroll */}
        <div className="h-[1200px]" />
      </nav>
      {/* Sticky Footer Section */}
      <div className="sticky bottom-0 bg-slate-950 border-t border-slate-800 p-4 space-y-3">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors duration-150 font-medium bg-slate-800">
          <Settings size={20} />
          <span>Preferences</span>
        </button>
        <div className="px-4 py-2 bg-slate-800/30 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-sm font-semibold text-white mt-1">
            {localStorage.getItem('userEmail')}
          </p>
        </div>
        <button className="bg-red-700 w-full py-2 rounded" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default SideNav;