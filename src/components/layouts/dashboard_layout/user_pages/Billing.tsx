import { AlertTriangle, CheckCircle2, Clock3, RotateCcw, Smartphone, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBillingOverview, getPaymentHistory, getPaymentStatus, initiatePayment } from "../../../../lib/api";
import type { BillingOverview, CurrentPlan, PaymentHistoryItem, PaymentHistoryPage, PaymentResponse, PaymentStatus, SubscriptionTier } from "../../../../lib/types";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;
const HISTORY_REFRESH_MS = 15000;
export const PAYMENT_HISTORY_PAGE_SIZE = 5;
const displayTier = (tier: string) => tier.charAt(0) + tier.slice(1).toLowerCase();
const isEntitlementState = (status: PaymentResponse["status"]) =>
  status === "PAID_AWAITING_DELIVERY" || status === "DELIVERED_PENDING_SETTLEMENT" || status === "SETTLED";
const isProgressingState = (status: PaymentResponse["status"]) =>
  status === "PENDING" || status === "PAID_AWAITING_DELIVERY" || status === "DELIVERED_PENDING_SETTLEMENT" || status === "REVIEW_REQUIRED";
const isHistoryRefreshState = (status: PaymentStatus) => isProgressingState(status) || status === "DISPUTED";

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
  const [history, setHistory] = useState<PaymentHistoryPage | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const pollAttempts = useRef(0);
  const historyRequestActive = useRef(false);
  const historyRefreshQueued = useRef(false);

  const loadOverview = useCallback(async () => {
    const data = await getBillingOverview();
    setOverview(data);
    setMobileNumber((current) => current || data.ecocashNumber || "");
  }, []);

  const loadHistory = useCallback(async (page = historyPage) => {
    if (historyRequestActive.current) {
      historyRefreshQueued.current = true;
      return;
    }
    historyRequestActive.current = true;
    setHistoryError("");
    try {
      do {
        historyRefreshQueued.current = false;
        const data = await getPaymentHistory({ page, size: PAYMENT_HISTORY_PAGE_SIZE });
        setHistory(data);
      } while (historyRefreshQueued.current);
    } catch (reason) {
      setHistoryError(reason instanceof Error ? reason.message : "Could not load payment history");
    } finally {
      historyRequestActive.current = false;
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    loadOverview().catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [loadOverview]);

  useEffect(() => { void loadHistory(historyPage); }, [historyPage, loadHistory]);

  useEffect(() => {
    if (!history?.content.some((item) => isHistoryRefreshState(item.status))) return undefined;
    const timer = window.setInterval(() => void loadHistory(historyPage), HISTORY_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [history, historyPage, loadHistory]);

  const refreshPayment = useCallback(async () => {
    if (!payment) return;
    const latest = await getPaymentStatus(payment.merchantReference);
    setPayment(latest);
    await loadHistory(historyPage);
    if (isEntitlementState(latest.status)) await loadOverview();
  }, [historyPage, loadHistory, loadOverview, payment]);

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
        const stateChanged = latest.status !== payment.status;
        setPayment(latest);
        if (stateChanged) await loadHistory(historyPage);
        if (isEntitlementState(latest.status)) await loadOverview();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not refresh payment status");
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [historyPage, loadHistory, loadOverview, payment, timedOut]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setTimedOut(false);
    pollAttempts.current = 0;
    try {
      setPayment(await initiatePayment(selectedTier, mobileNumber, saveNumber));
      setHistoryPage(0);
      await loadHistory(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start the payment");
    } finally {
      setSubmitting(false);
    }
  };

  const changeHistoryPage = (page: number) => {
    if (historyLoading || page < 0 || (history && page >= history.totalPages)) return;
    setHistoryLoading(true);
    setHistoryPage(page);
  };

  if (loading) return <div className="app-card app-muted">Loading billing…</div>;

  const selected = overview?.tiers.find((tier) => tier.tier === selectedTier);
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
          <SubscriptionSummary currentPlan={overview?.currentPlan ?? null} serviceCount={overview?.serviceCount ?? 0}
            selectedTier={selectedTier} />
        </div>
      </div>
      <PaymentHistory
        history={history}
        loading={historyLoading}
        error={historyError}
        onRetry={() => void loadHistory(historyPage)}
        onPageChange={changeHistoryPage}
      />
    </div>
  );
}

const currentPlanStatus = (status: PaymentStatus) => {
  if (status === "SETTLED") return "Active · payment settled";
  if (status === "PAID_AWAITING_DELIVERY") return "Active · awaiting delivery";
  if (status === "DELIVERED_PENDING_SETTLEMENT") return "Active · settlement pending";
  return status.replaceAll("_", " ").toLowerCase();
};

export function SubscriptionSummary({ currentPlan, serviceCount, selectedTier }: {
  currentPlan: CurrentPlan | null;
  serviceCount: number;
  selectedTier: SubscriptionTier;
}) {
  if (!currentPlan) {
    return <div className="mt-4 text-sm"><p className="font-medium">No active plan</p>
      <p className="app-muted mt-2">You are currently on the free tier. Choose a plan to activate paid access.</p>
      <dl className="mt-4 space-y-3"><div className="flex justify-between gap-4"><dt className="app-muted">Services in use</dt><dd className="font-medium">{serviceCount}</dd></div>
        <div className="flex justify-between gap-4"><dt className="app-muted">Selected plan</dt><dd className="font-medium">{displayTier(selectedTier)}</dd></div></dl></div>;
  }
  return <div className="mt-4 text-sm"><dl className="space-y-3">
    <div className="flex justify-between gap-4"><dt className="app-muted">Current plan</dt><dd className="font-medium">{displayTier(currentPlan.tier)}</dd></div>
    <div className="flex justify-between gap-4"><dt className="app-muted">Status</dt><dd className="font-medium text-right">{currentPlanStatus(currentPlan.status)}</dd></div>
    <div className="flex justify-between gap-4"><dt className="app-muted">Amount paid</dt><dd className="font-medium">{currentPlan.currency} {currentPlan.amountPaid.toFixed(2)}</dd></div>
    <div className="flex justify-between gap-4"><dt className="app-muted">Purchased</dt><dd className="font-medium text-right">{formatDate(currentPlan.purchasedAt)}</dd></div>
    <div className="flex justify-between gap-4"><dt className="app-muted">Access through</dt><dd className="font-medium text-right">{formatDate(currentPlan.periodEnd)}</dd></div>
    <div className="flex justify-between gap-4"><dt className="app-muted">Services in use</dt><dd className="font-medium">{serviceCount}</dd></div>
  </dl><p className="app-muted mt-4">Manual renewal — you will not be charged automatically.</p></div>;
}

export function PaymentState({ payment, timedOut, onRefresh }: { payment: PaymentResponse; timedOut: boolean; onRefresh: () => void }) {
  const paid = payment.status === "SETTLED";
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

const statusTone = (status: PaymentStatus) => {
  if (status === "SETTLED") return "bg-[var(--app-success-soft)] text-[var(--app-success-text)]";
  if (status === "FAILED" || status === "CANCELLED") return "bg-[var(--app-danger-soft)] text-[var(--app-danger)]";
  if (status === "DISPUTED" || status === "REVIEW_REQUIRED") return "bg-[var(--app-warning-soft)] text-[var(--app-warning-text)]";
  return "bg-[var(--app-status-muted-bg)] text-[var(--app-status-muted-text)]";
};

const formatDate = (value?: string | null) => value
  ? new Date(value).toLocaleString(undefined, { timeZone: "Africa/Harare" })
  : "—";
const formatMethod = (value: string) => value === "ECOCASH" ? "EcoCash" : value;

function HistoryStatus({ item }: { item: PaymentHistoryItem }) {
  return <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold leading-tight ${statusTone(item.status)}`}>{item.statusLabel}</span>;
}

export function PaymentHistory({ history, loading, error, onRetry, onPageChange }: {
  history: PaymentHistoryPage | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="app-card overflow-hidden" aria-labelledby="payment-history-title" aria-busy={loading}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h2 id="payment-history-title" className="text-lg font-semibold">Payment history</h2>
          <p className="app-muted mt-1 text-sm">Recent payment attempts associated with your account.</p>
        </div>
        {history && history.totalElements > 0 ? (
          <p className="app-muted shrink-0 text-sm sm:pt-1">
            {history.totalElements} {history.totalElements === 1 ? "transaction" : "transactions"}
          </p>
        ) : null}
      </div>
      {loading && !history ? <div className="app-muted mt-6 animate-pulse" role="status">Loading payment history…</div> : null}
      {loading && history ? <p className="app-muted mt-3 animate-pulse text-xs" role="status">Updating payment history…</p> : null}
      {!loading && error ? <div className="app-warning-panel mt-6"><p>{error}</p><button type="button" className="app-button-secondary mt-3" onClick={onRetry}>Retry</button></div> : null}
      {!loading && !error && history?.content.length === 0 ? <p className="app-muted mt-6">No payment attempts yet.</p> : null}
      {!error && history && history.content.length > 0 ? (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="app-muted border-b border-[var(--app-border)] text-xs uppercase tracking-wide"><tr><th className="w-[18%] pb-2.5 pr-3 font-medium">Date</th><th className="w-[20%] pb-2.5 pr-3 font-medium">Reference</th><th className="w-[10%] pb-2.5 pr-3 font-medium">Plan</th><th className="w-[13%] pb-2.5 pr-3 font-medium">Amount</th><th className="w-[11%] pb-2.5 pr-3 font-medium">Method</th><th className="w-[28%] pb-2.5 font-medium">Status</th></tr></thead>
              <tbody>{history.content.map((item) => <tr key={item.merchantReference} className="border-b border-[var(--app-border)] align-top last:border-b-0"><td className="py-3 pr-3 text-xs leading-5">{formatDate(item.createdAt)}</td><td className="py-3 pr-3"><p className="truncate font-mono text-xs" title={item.merchantReference}>{item.merchantReference}</p></td><td className="py-3 pr-3">{displayTier(item.subscriptionTier)}</td><td className="whitespace-nowrap py-3 pr-3 font-medium">{item.currency} {item.amount.toFixed(2)}</td><td className="py-3 pr-3">{formatMethod(item.paymentChannel)}</td><td className="py-3"><HistoryStatus item={item} /><p className="app-muted mt-1.5 line-clamp-2 text-xs leading-4" title={item.message}>{item.message}</p>{item.completedAt ? <p className="app-muted mt-1 truncate text-xs" title={`Completed: ${formatDate(item.completedAt)}`}>Completed: {formatDate(item.completedAt)}</p> : null}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-4 space-y-2.5 md:hidden">{history.content.map((item) => <article key={item.merchantReference} className="app-surface-soft rounded-xl border border-[var(--app-border)] p-3"><div className="flex min-w-0 items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold">{item.currency} {item.amount.toFixed(2)}</p><p className="app-muted mt-0.5 truncate font-mono text-xs" title={item.merchantReference}>{item.merchantReference}</p></div><div className="shrink-0"><HistoryStatus item={item} /></div></div><dl className="mt-3 space-y-1.5 text-xs"><div className="flex justify-between gap-3"><dt className="app-muted">Plan and method</dt><dd className="text-right font-medium">{displayTier(item.subscriptionTier)} · {formatMethod(item.paymentChannel)}</dd></div><div className="flex justify-between gap-3"><dt className="app-muted shrink-0">Created</dt><dd className="text-right">{formatDate(item.createdAt)}</dd></div>{item.completedAt ? <div className="flex justify-between gap-3"><dt className="app-muted shrink-0">Completed</dt><dd className="text-right">{formatDate(item.completedAt)}</dd></div> : null}</dl><p className="app-muted mt-2 border-t border-[var(--app-border)] pt-2 text-xs leading-4">{item.message}</p></article>)}</div>
          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--app-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="app-muted text-center text-sm sm:text-left" aria-live="polite">Page {history.page + 1} of {Math.max(history.totalPages, 1)}</p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button type="button" className="app-button-secondary min-w-0 flex-1 sm:flex-none" disabled={loading || history.page <= 0} onClick={() => onPageChange(history.page - 1)}>Previous</button>
              <button type="button" className="app-button-secondary min-w-0 flex-1 sm:flex-none" disabled={loading || history.page >= history.totalPages - 1} onClick={() => onPageChange(history.page + 1)}>Next</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
