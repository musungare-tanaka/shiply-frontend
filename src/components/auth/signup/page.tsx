import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import BASE_URL, { getErrorMessage } from "../../../util/util";
import { isGoogleIdentityEnabled, renderGoogleButton } from "../../../util/google";
import { setAuthSession } from "../../../util/auth";
import AuthShell from "../AuthShell";
import PasswordField from "../PasswordField";

const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
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

        setAuthSession(data);
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
        body: JSON.stringify({ email, password, fullName: fullName.trim() || undefined }),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Signup failed"));
      }

      const data = await res.json();

      setAuthSession(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your Shiply account"
      subtitle="Start deploying your apps in minutes"
      footer={
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-[#474b4f] font-medium hover:underline">
            Log in
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
          Google sign-in is disabled locally until `GOOGLE_CLIENT_ID` is configured.
        </p>
      )}

      <form className="space-y-4" onSubmit={handleManualSignup}>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div>
          <label htmlFor="signup-full-name" className="block text-sm font-medium text-gray-600">Full Name</label>
          <input
            id="signup-full-name"
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-600">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@company.com"
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
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#474b4f] text-white py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Signup;
