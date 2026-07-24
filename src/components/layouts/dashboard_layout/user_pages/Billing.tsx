import { CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

const DEMO_SUBMISSION_DELAY_MS = 1600;

export default function Billing() {
  const [mobileNumber, setMobileNumber] = useState("077 123 4567");
  const [amount, setAmount] = useState("24.99");
  const [paymentMethod, setPaymentMethod] = useState("Paynow Wallet");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    if (!resultMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setResultMessage("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [resultMessage]);

  const handleMockPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResultMessage("");

    await new Promise((resolve) => {
      window.setTimeout(resolve, DEMO_SUBMISSION_DELAY_MS);
    });

    setResultMessage("Mock payment approved. Demo only: no real charge was created or processed.");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Billing</h1>
        <p className="app-page-subtitle">
          Review subscription details, invoices, and account spending once billing goes live.
        </p>
      </div>

      <div className="app-warning-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">Demo Billing</p>
            <p className="mt-2 text-sm leading-6">
              Billing is not connected yet. This page is a visual demonstration only so the account area can preview a
              future payment experience without implying that live payments are available.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
            Mock Payment
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="app-card">
          <div className="app-mobile-stack gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-accent-soft)] p-3 text-[var(--app-accent)]">
                <CreditCard size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold">Paynow Demo Checkout</p>
                <p className="app-muted mt-1 text-sm">
                  Mock payment flow only. No API calls, webhooks, or real payment processing are connected.
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] app-muted">
              Demo
            </span>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleMockPayment}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="paynow-mobile" className="app-label">
                  Mobile Number
                </label>
                <div className="relative">
                  <Smartphone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 app-muted" />
                  <input
                    id="paynow-mobile"
                    className="app-input pl-10"
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value)}
                    placeholder="077 123 4567"
                    autoComplete="off"
                    inputMode="tel"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="app-muted mt-2 text-xs">Use demo-safe values only. This form does not store or send numbers anywhere.</p>
              </div>

              <div>
                <label htmlFor="paynow-amount" className="app-label">
                  Amount
                </label>
                <input
                  id="paynow-amount"
                  className="app-input"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="24.99"
                  autoComplete="off"
                  inputMode="decimal"
                  disabled={isSubmitting}
                />
                <p className="app-muted mt-2 text-xs">Displayed for UI preview only. No billing record or charge is created.</p>
              </div>
            </div>

            <div>
              <label htmlFor="paynow-method" className="app-label">
                Payment Method
              </label>
              <select
                id="paynow-method"
                className="app-input"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                disabled={isSubmitting}
              >
                <option>Paynow Wallet</option>
                <option>Paynow Mobile Money</option>
                <option>Paynow Card</option>
              </select>
              <p className="app-muted mt-2 text-xs">All options are mock UI states only and do not connect to Paynow services.</p>
            </div>

            {resultMessage ? (
              <div className="rounded-2xl border border-[rgba(21,128,61,0.28)] bg-[var(--app-success-soft)] p-4 text-sm font-medium text-[var(--app-success-text)]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--app-success)]" />
                  <p>{resultMessage}</p>
                </div>
              </div>
            ) : null}

            <div className="app-mobile-stack gap-3 border-t border-[var(--app-border)] pt-4">
              <p className="app-muted max-w-2xl text-sm">
                Clicking the button below simulates a short processing state and then shows a mock success message.
                No network requests are sent and no payment information is collected or stored.
              </p>
              <button type="submit" className="app-button-primary" disabled={isSubmitting}>
                {isSubmitting ? "Simulating Paynow Payment..." : "Pay with Paynow"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="app-card">
            <p className="text-lg font-semibold">Demo Summary</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="app-muted">Provider</span>
                <span className="font-medium">Paynow</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="app-muted">Mode</span>
                <span className="font-medium">Visual demonstration only</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="app-muted">Expected result</span>
                <span className="font-medium">Mock success</span>
              </div>
            </div>
          </div>

          <div className="app-card">
            <p className="text-lg font-semibold">What stays unchanged</p>
            <ul className="app-muted mt-4 space-y-2 text-sm leading-6">
              <li>No real Paynow API or SDK integration</li>
              <li>No backend billing endpoints or webhooks</li>
              <li>No storage of payment details</li>
              <li>No changes to other pages or account workflows</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
