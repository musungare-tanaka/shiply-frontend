import { useState } from "react";
import { Menu, X } from "lucide-react";
import SideNav from "../side_nav/page";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed z-50 inset-y-0 left-0
          transform transition-transform duration-300
          bg-slate-950
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
        `}
      >
        <SideNav />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-5 border-b bg-slate-900 ">
          <button onClick={() => setOpen(!open)} className=" bg-gray-900 foreground-white border-white p-1 rounded-md">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        <img src="public/transparent-logo.png" alt="Shiply" className="h-8 w-auto" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
