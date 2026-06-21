import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const AuthShell = ({ title, subtitle, children, footer }: AuthShellProps) => {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-center mb-6">
        <img
          src="/shiply-logo.png"
          alt="Shiply Logo"
          className="h-20 w-30"
        />
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#474b4f]">{title}</h1>
        <p className="text-gray-500 mt-2 text-sm">{subtitle}</p>
      </div>

      {children}

      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
};

export default AuthShell;
