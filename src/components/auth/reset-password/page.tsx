import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthShell from "../AuthShell";
import PasswordField from "../PasswordField";
import BASE_URL, { getErrorMessage } from "../../../util/util";
import { clearResetFlow, getResetEmail, getResetToken } from "../resetFlowStorage";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = getResetEmail();
    const storedToken = getResetToken();

    if (!storedEmail || !storedToken) {
      navigate("/forgot-password", { replace: true });
      return;
    }

    setEmail(storedEmail);
    setResetToken(storedToken);
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to reset your password"));
      }

      const data = await response.json();
      clearResetFlow();
      setSuccessMessage(data.message ?? "Password reset successful. Please login with your new password.");
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset your password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use the same password rules as signup, then sign back in."
      footer={
        <p className="text-center text-sm text-gray-500">
          Need a new code?{" "}
          <Link to="/forgot-password" className="text-[#474b4f] font-medium hover:underline">
            Start over
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <p className="text-red-500 text-sm text-center">{error}</p> : null}
        {successMessage ? <p className="text-green-600 text-sm text-center">{successMessage}</p> : null}

        <div>
          <label className="block text-sm font-medium text-gray-600">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 w-full rounded-md border text-black bg-gray-100 border-gray-300 px-3 py-2"
          />
        </div>

        <PasswordField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
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
          disabled={loading}
          className="w-full bg-[#474b4f] text-white py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
