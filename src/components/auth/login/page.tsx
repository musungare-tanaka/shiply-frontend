import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useRef } from "react";
import BASE_URL from "../../../util/util";

interface GoogleResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleResponse) => void;
  }) => void;
  renderButton: (
    element: HTMLElement | null,
    config: {
      theme: string;
      size: string;
      width: number;
    }
  ) => void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Prevent multiple Google button renders
  const googleBtnRendered = useRef(false);

  // =======================
  // GOOGLE LOGIN
  // =======================
  useEffect(() => {
    if (!window.google || googleBtnRendered.current) return;

    googleBtnRendered.current = true;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response: GoogleResponse) => {
        setError("");
        setLoading(true);

        try {
          const res = await fetch(`${BASE_URL}/auth/login/google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: response.credential }),
          });

          if (!res.ok) {
            throw new Error("Google login failed");
          }

          const data = await res.json();

          localStorage.setItem("token", data.token);
          localStorage.setItem("userEmail", data.user.email);
          localStorage.setItem("userRole", data.user.role);

          navigate("/dashboard");
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Google login failed"
          );
        } finally {
          setLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById("google-signin-button"),
      {
        theme: "outline",
        size: "large",
        width: 300,
      }
    );
  }, [navigate]);

  // =======================
  // MANUAL LOGIN
  // =======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
      {/* Company Logo */}
      <div className="flex justify-center mb-6">
        <img
          src="public/shiply-logo.png"
          alt="Shiply Logo"
          className="h-20 w-30"
        />
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#474b4f]">
          Login to your Shiply account
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Start deploying your apps in minutes
        </p>
      </div>

      {/* Google Login */}
      <div id="google-signin-button" className="flex justify-center mb-6" />

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="px-3 text-sm text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Login Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md text-black bg-white border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#474b4f] text-white py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Signup link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="text-[#474b4f] font-medium hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
