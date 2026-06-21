import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthShell from "../AuthShell";
import BASE_URL, { getErrorMessage } from "../../../util/util";
import {
  clearResetFlow,
  getResetEmail,
  saveResetEmail,
  saveResetToken,
} from "../resetFlowStorage";

const VerifyResetOtp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = getResetEmail();
    if (!storedEmail) {
      navigate("/forgot-password", { replace: true });
      return;
    }

    setEmail(storedEmail);
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to verify the code"));
      }

      const data = await response.json();
      saveResetEmail(email);
      saveResetToken(data.resetToken);
      navigate("/reset-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify the code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Verify your code"
      subtitle="Enter the 6-digit code sent to your email to continue."
      footer={
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            Need another code?{" "}
            <Link to="/forgot-password" className="text-[#474b4f] font-medium hover:underline">
              Request a new one
            </Link>
          </p>
          <button
            type="button"
            className="text-[#474b4f] font-medium hover:underline"
            onClick={() => {
              clearResetFlow();
              navigate("/login");
            }}
          >
            Cancel and return to login
          </button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <p className="text-red-500 text-sm text-center">{error}</p> : null}

        <div>
          <label className="block text-sm font-medium text-gray-600">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 w-full rounded-md border text-black bg-gray-100 border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1 w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
            placeholder="123456"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#474b4f] text-white py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify code"}
        </button>
      </form>
    </AuthShell>
  );
};

export default VerifyResetOtp;
