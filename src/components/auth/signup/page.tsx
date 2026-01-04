import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BASE_URL from "../../../util/util";

interface GoogleResponse {
  credential: string;
}

const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response: GoogleResponse) => {
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
            throw new Error("Google signup failed");
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



  const handleManualSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Signup failed");
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

      <div id="google-signin-button" className="flex justify-center mb-6" />

      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="px-3 text-sm text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

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