import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import BASE_URL, { getErrorMessage } from "../../../util/util";
import { isGoogleIdentityEnabled, renderGoogleButton } from "../../../util/google";

const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRendered = useRef(false);

  useEffect(() => {
    if (!isGoogleIdentityEnabled) {
      return;
    }

    if (googleBtnRendered.current) return;

    googleBtnRendered.current = true;

    renderGoogleButton("google-signin-button", async (response) => {
      const token = response.credential;

      try {
        setError("");
        setIsLoading(true);

        const res = await fetch(`${BASE_URL}/auth/signup/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          throw new Error(await getErrorMessage(res, "Google signup failed"));
        }

        const data = await res.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);

        navigate("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Signup failed");
      } finally {
        setIsLoading(false);
      }
    }).catch((err: Error) => {
      googleBtnRendered.current = false;
      setError(err.message);
    });
  }, [navigate]);



  const handleManualSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Signup failed"));
      }

      const data = await res.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#474b4f]">Create your Shiply account</h1>
        <p className="text-gray-500 mt-2 text-sm">Start deploying your apps in minutes</p>
      </div>

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

      <form className="space-y-4" onSubmit={handleManualSignup}>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-600">Email</label>
          <input
            type="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md text-black bg-white border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">Confirm Password</label>
          <input
            type="password"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#474b4f] text-white py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-[#474b4f] font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default Signup;
