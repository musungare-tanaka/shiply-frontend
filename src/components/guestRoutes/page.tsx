import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../util/auth";

interface GuestRouteProps {
  children: JSX.Element;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
