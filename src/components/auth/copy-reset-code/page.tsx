import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../AuthShell";
import BASE_URL, { getErrorMessage } from "../../../util/util";
import { clearResetFlow, savePendingResetOtp } from "../resetFlowStorage";

const CopyResetCode = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    if (!token) {
      setError("This code link is invalid or expired. Request a new password reset code.");
      setLoading(false);
      return;
    }

    const loadCode = async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/password-reset-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          referrerPolicy: "no-referrer",
          body: JSON.stringify({ token }),
        });
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "This code link is invalid or expired. Request a new code."));
        }
        const data: { code?: unknown } = await response.json();
        if (typeof data.code !== "string" || !/^\d{6}$/.test(data.code)) {
          throw new Error("We could not load this code. Request a new password reset code.");
        }
        setCode(data.code);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "We could not load this code. Request a new password reset code.");
      } finally {
        setLoading(false);
      }
    };

    void loadCode();
  }, []);

  const copyCode = async () => {
    setCopyMessage("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable");
      await navigator.clipboard.writeText(code);
      setCopyMessage("Code copied");
    } catch {
      setCopyMessage("Copying was blocked. Select the code above, then copy it manually.");
    }
  };

  const continueToReset = () => {
    clearResetFlow();
    savePendingResetOtp(code);
    navigate("/verify-reset-otp");
  };

  return (
    <AuthShell
      title="Your password reset code"
      subtitle="Copy this code, then verify it to continue resetting your password."
      footer={(
        <p className="text-center text-sm text-gray-500">
          Need a new code?{" "}
          <Link to="/forgot-password" className="font-medium text-[#474b4f] hover:underline">Request another code</Link>
        </p>
      )}
    >
      <div className="space-y-4">
        {loading ? <p role="status" className="text-center text-sm text-gray-600">Loading your code…</p> : null}
        {error ? <p role="alert" className="text-center text-sm text-red-600">{error}</p> : null}
        {code ? (
          <>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-center">
              <code aria-label="Password reset code" className="select-all font-mono text-4xl font-bold tracking-[0.3em] text-[#25292d]">{code}</code>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="w-full rounded-md bg-[#474b4f] py-3 font-medium text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#474b4f] focus:ring-offset-2"
            >
              Copy code
            </button>
            <p aria-live="polite" className={copyMessage === "Code copied" ? "text-center text-sm text-green-700" : "text-center text-sm text-amber-700"}>
              {copyMessage}
            </p>
            <button
              type="button"
              onClick={continueToReset}
              className="w-full rounded-md border border-[#474b4f] py-3 font-medium text-[#474b4f] transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#474b4f] focus:ring-offset-2"
            >
              Continue to password reset
            </button>
          </>
        ) : null}
      </div>
    </AuthShell>
  );
};

export default CopyResetCode;
