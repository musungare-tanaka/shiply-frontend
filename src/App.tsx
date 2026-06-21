import "./App.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import LandingPage from "./components/landing_page/page";
import Login from "./components/auth/login/page";
import Signup from "./components/auth/signup/page";
import ForgotPassword from "./components/auth/forgot-password/page";
import VerifyResetOtp from "./components/auth/verify-reset-otp/page";
import ResetPassword from "./components/auth/reset-password/page";
import ProtectedRoute from "./components/protectedRoutes/page";
import UserLayout from "./components/layouts/dashboard_layout/page";

function AppContent() {
  const location = useLocation();
  const isCentered =
    location.pathname === "/login"
    || location.pathname === "/signup"
    || location.pathname === "/forgot-password"
    || location.pathname === "/verify-reset-otp"
    || location.pathname === "/reset-password";

  return (
    <div
      className={
        isCentered
          ? "w-screen h-screen flex items-center justify-center bg-gray-100 px-4"
          : "w-full"
      }
    >
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <UserLayout />
              
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
