import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthShell from "../AuthShell";
import BASE_URL, { getErrorMessage } from "../../../util/util";
import { saveResetEmail } from "../resetFlowStorage";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to process your request right now"));
      }

      const data = await response.json();
      saveResetEmail(email.trim().toLowerCase());
      setMessage(data.message ?? "If this email exists, an OTP has been sent.");
      navigate("/verify-reset-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process your request right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email and we’ll send you a verification code."
      footer={
        <p className="text-center text-sm text-gray-500">
          Remembered it?{" "}
          <Link to="/login" className="text-[#474b4f] font-medium hover:underline">
            Back to login
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <p className="text-red-500 text-sm text-center">{error}</p> : null}
        {message ? <p className="text-green-600 text-sm text-center">{message}</p> : null}

        <div>
          <label className="block text-sm font-medium text-gray-600">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
            placeholder="you@company.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#474b4f] text-white py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Sending code..." : "Send reset code"}
        </button>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
