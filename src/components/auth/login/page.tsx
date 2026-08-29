import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useRef } from "react";
import BASE_URL, { getErrorMessage } from "../../../util/util";
import { isGoogleIdentityEnabled, renderGoogleButton } from "../../../util/google";
import { setAuthSession } from "../../../util/auth";
import AuthShell from "../AuthShell";
import PasswordField from "../PasswordField";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const resolveRedirectPath = () => {
    const state = location.state as { from?: { pathname?: string; search?: string } } | null;
    if (state?.from?.pathname) {
      return `${state.from.pathname}${state.from.search || ""}`;
    }
    return "/dashboard";
  };

  // Prevent multiple Google button renders
  const googleBtnRendered = useRef(false);

  // =======================
  // GOOGLE LOGIN
  // =======================
  useEffect(() => {
    if (!isGoogleIdentityEnabled) {
      return;
    }

    if (googleBtnRendered.current) return;

    googleBtnRendered.current = true;

    renderGoogleButton("google-signin-button", async (response) => {
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
          throw new Error(await getErrorMessage(res, "Google login failed"));
        }

        const data = await res.json();

        setAuthSession(data);
        navigate(resolveRedirectPath(), { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google login failed");
      } finally {
        setLoading(false);
      }
    }).catch((err: Error) => {
      googleBtnRendered.current = false;
      setError(err.message);
    });
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
        throw new Error(await getErrorMessage(response, "Invalid email or password"));
      }

      const data = await response.json();

      setAuthSession(data);
      navigate(resolveRedirectPath(), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Login to your Shiply account"
      subtitle="Start deploying your apps in minutes"
      footer={
        <p className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-[#474b4f] font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    >
      {isGoogleIdentityEnabled ? (
        <>
          <div id="google-signin-button" className="flex justify-center mb-6" />

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
        </>
      ) : (
        <p className="mb-6 text-center text-xs text-gray-400">
          Google sign-in is disabled locally until `VITE_GOOGLE_CLIENT_ID` is configured.
        </p>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-600">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
          />
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-[#474b4f] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#474b4f] text-white py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
