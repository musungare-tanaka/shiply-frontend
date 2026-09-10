import { AlertTriangle, CheckCircle2, Clock3, RotateCcw, Smartphone, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBillingOverview, getPaymentStatus, initiatePayment } from "../../../../lib/api";
import type { BillingOverview, PaymentResponse, SubscriptionTier } from "../../../../lib/types";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;
const displayTier = (tier: string) => tier.charAt(0) + tier.slice(1).toLowerCase();
const isEntitlementState = (status: PaymentResponse["status"]) =>
  status === "PAID_AWAITING_DELIVERY" || status === "DELIVERED_PENDING_SETTLEMENT" || status === "SETTLED";
const isProgressingState = (status: PaymentResponse["status"]) =>
  status === "PENDING" || status === "PAID_AWAITING_DELIVERY" || status === "DELIVERED_PENDING_SETTLEMENT" || status === "REVIEW_REQUIRED";

export default function Billing() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("STARTER");
  const [mobileNumber, setMobileNumber] = useState("");
  const [saveNumber, setSaveNumber] = useState(true);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState("");
  const pollAttempts = useRef(0);

  const loadOverview = useCallback(async () => {
    const data = await getBillingOverview();
    setOverview(data);
    setMobileNumber((current) => current || data.ecocashNumber || "");
  }, []);

  useEffect(() => {
    loadOverview().catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [loadOverview]);

  const refreshPayment = useCallback(async () => {
    if (!payment) return;
    const latest = await getPaymentStatus(payment.merchantReference);
    setPayment(latest);
    if (isEntitlementState(latest.status)) await loadOverview();
  }, [loadOverview, payment]);

  useEffect(() => {
    if (!payment || !isProgressingState(payment.status) || timedOut) return undefined;
    const timer = window.setInterval(async () => {
      pollAttempts.current += 1;
      if (pollAttempts.current > MAX_POLL_ATTEMPTS) {
        setTimedOut(true);
        window.clearInterval(timer);
        return;
      }
      try {
        const latest = await getPaymentStatus(payment.merchantReference);
        setPayment(latest);
        if (isEntitlementState(latest.status)) await loadOverview();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not refresh payment status");
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadOverview, payment, timedOut]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setTimedOut(false);
    pollAttempts.current = 0;
    try {
      setPayment(await initiatePayment(selectedTier, mobileNumber, saveNumber));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start the payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="app-card app-muted">Loading billing…</div>;

  const selected = overview?.tiers.find((tier) => tier.tier === selectedTier);
  const active = overview?.activeTier && overview.currentPeriodEnd
    ? `${displayTier(overview.activeTier)} until ${new Date(overview.currentPeriodEnd).toLocaleDateString()}`
    : "No active subscription";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Billing</h1>
        <p className="app-page-subtitle">Choose a monthly plan and pay securely with EcoCash through Paynow.</p>
      </div>
      {!overview?.enabled ? (
        <div className="app-warning-panel">
          <p className="font-semibold">Payments are currently unavailable</p>
          <p className="mt-2 text-sm">Paynow has not been enabled for this environment. No payment can be submitted.</p>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {overview?.tiers.map((tier) => (
          <button key={tier.tier} type="button" disabled={!overview.enabled || submitting}
            onClick={() => setSelectedTier(tier.tier)}
            className={`app-card text-left transition ${selectedTier === tier.tier ? "ring-2 ring-[var(--app-accent)]" : ""}`}>
            <p className="text-lg font-semibold">{displayTier(tier.tier)}</p>
            <p className="mt-3 text-2xl font-bold">ZWG {tier.zwgPrice.toFixed(2)}<span className="app-muted text-sm font-normal"> / month</span></p>
            <p className="app-muted mt-2 text-sm">Up to {tier.maxServices} deployable services · anchored at USD {tier.usdPrice}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="app-card">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[var(--app-accent-soft)] p-3 text-[var(--app-accent)]"><Smartphone size={22} /></div>
            <div><p className="text-lg font-semibold">Pay with EcoCash</p><p className="app-muted mt-1 text-sm">You will receive a PIN prompt on your phone.</p></div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="paynow-mobile" className="app-label">EcoCash number</label>
              <input id="paynow-mobile" className="app-input" value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value)} placeholder="077 123 4567"
                autoComplete="tel" inputMode="tel" disabled={!overview?.enabled || submitting || Boolean(payment && isProgressingState(payment.status))} required />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={saveNumber} onChange={(event) => setSaveNumber(event.target.checked)}
                disabled={!overview?.enabled || submitting || Boolean(payment && isProgressingState(payment.status))} />
              Save this number after a successful payment
            </label>
            {error ? <div className="rounded-xl border p-3 text-sm text-red-700">{error}</div> : null}
            {payment ? <PaymentState payment={payment} timedOut={timedOut} onRefresh={() => void refreshPayment()} /> : null}
            <button type="submit" className="app-button-primary"
              disabled={!overview?.enabled || submitting || Boolean(payment && isProgressingState(payment.status))}>
              {submitting ? "Starting payment…" : `Pay ZWG ${selected?.zwgPrice.toFixed(2) ?? "—"}`}
            </button>
          </form>
        </div>
        <div className="app-card">
          <p className="text-lg font-semibold">Subscription summary</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="app-muted">Current plan</dt><dd className="font-medium text-right">{active}</dd></div>
            <div className="flex justify-between gap-4"><dt className="app-muted">Services in use</dt><dd className="font-medium">{overview?.serviceCount ?? 0}</dd></div>
            <div className="flex justify-between gap-4"><dt className="app-muted">Selected plan</dt><dd className="font-medium">{displayTier(selectedTier)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="app-muted">Payment method</dt><dd className="font-medium">EcoCash</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function PaymentState({ payment, timedOut, onRefresh }: { payment: PaymentResponse; timedOut: boolean; onRefresh: () => void }) {
  const paid = isEntitlementState(payment.status);
  const pending = isProgressingState(payment.status);
  const review = payment.status === "DISPUTED" || payment.status === "REVIEW_REQUIRED";
  const refunded = payment.status === "REFUNDED";
  const Icon = paid ? CheckCircle2 : review ? AlertTriangle : pending ? Clock3 : refunded ? RotateCcw : XCircle;
  return (
    <div className={`rounded-2xl border p-4 text-sm ${paid ? "bg-[var(--app-success-soft)] text-[var(--app-success-text)]" : "bg-[var(--app-surface-soft)]"}`}>
      <div className="flex items-start gap-3"><Icon size={19} className="mt-0.5 shrink-0" /><div><p className="font-semibold">{payment.message}</p>
        <p className="app-muted mt-1 text-xs">Reference: {payment.merchantReference}</p></div></div>
      {pending && timedOut ? <button type="button" className="app-button-secondary mt-3" onClick={onRefresh}>Refresh payment status</button> : null}
    </div>
  );
}
