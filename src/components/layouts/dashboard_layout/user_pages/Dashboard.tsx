import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, CreditCard, ReceiptText, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import BASE_URL, { getErrorMessage } from "../../../../util/util";
import { getBillingOverview } from "../../../../lib/api";
import type { BillingOverview, PaymentHistoryItem, PaymentStatus } from "../../../../lib/types";
import NoProject from "./NoProject";
import CreateProject from "./CreateProject";
import type { ProjectsData } from "../../../interfaces/ProjectData";
import { getCurrentUserFullName, getCurrentUserRole, getCurrentUserStatus, logout } from "../../../../util/auth";

export default function Dashboard() {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [reload, setReload] = useState(0);
  const [dashboardData, setDashboardData] = useState<ProjectsData | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  const logoutAndRedirect = () => {
    logout();
    window.location.href = "/login";
  };

  const checkIfNewUser = async () => {
    try {
      setDashboardError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        logoutAndRedirect();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/projects/new-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401 || response.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load your account"));
      }

      const result = await response.json();
      setIsNewUser(result);

    } catch (error) {
      console.error("Auth validation failed:", error);
      setDashboardError(error instanceof Error ? error.message : "Failed to load your account");
    }
  };

  const fetchDashboardData = async () => {
    try {
      setDashboardError(null);
      setIsLoadingDashboard(true);
      const token = localStorage.getItem("token");

      if (!token) {
        logoutAndRedirect();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/projects/get-dashboard-data`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401 || response.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load dashboard data"));
      }

      const result: ProjectsData = await response.json();
      setDashboardData(result);

    } catch (error) {
      console.error("Dashboard fetch failed:", error);
      setDashboardError(error instanceof Error ? error.message : "Failed to load dashboard data");
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const fetchBillingData = async () => {
    setBillingError(null);
    setIsLoadingBilling(true);
    try {
      setBilling(await getBillingOverview());
    } catch (error) {
      setBilling(null);
      setBillingError(error instanceof Error ? error.message : "Failed to load billing overview");
    } finally {
      setIsLoadingBilling(false);
    }
  };

  useEffect(() => {
    void checkIfNewUser();
  }, [reload]);

  useEffect(() => {
    if (isNewUser === false) {
      void fetchDashboardData();
      void fetchBillingData();
    }
  }, [isNewUser]);

  if (isNewUser === null && !dashboardError) {
    return (
      <div className="app-loading-state min-h-[70vh]">
        Checking your account...
      </div>
    );
  }

  if (isNewUser === null && dashboardError) {
    return <ErrorState message={dashboardError} onRetry={() => setReload((prev) => prev + 1)} />;
  }

  if (creating) {
    return (
      <CreateProject
        onSuccess={() => {
          setCreating(false);
          setReload(prev => prev + 1);
        }}
        onCancel={() => {
          setCreating(false);
          setReload(prev => prev + 1);
        }}
      />
    );
  }

  if (isNewUser) {
    return <NoProject onCreate={() => setCreating(true)} />;
  }

  if (isLoadingDashboard) {
    return (
      <div className="app-loading-state min-h-[70vh]">
        Loading dashboard...
      </div>
    );
  }

  if (dashboardError) {
    return <ErrorState message={dashboardError} onRetry={() => void fetchDashboardData()} />;
  }

  if (!dashboardData) {
    return <ErrorState message="No dashboard data is available yet." onRetry={() => void fetchDashboardData()} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="app-page-title">Dashboard</h1>
        <p className="app-page-subtitle">
          A quick view of your current projects, services, and billing.
        </p>
      </div>

      <div className="app-card">
        <p className="text-lg font-semibold">
          {getCurrentUserFullName() || "Welcome back"}
        </p>
        <p className="app-muted mt-2 text-sm">
          Role: {getCurrentUserRole() || "USER"} • Account status: {getCurrentUserStatus() || "ACTIVE"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatCard title="Projects" value={dashboardData.totalProjects} />
        <StatCard title="Active Services" value={dashboardData.activeServices} />
      </div>

      <BillingSnapshot overview={billing} loading={isLoadingBilling} error={billingError}
        onRetry={() => void fetchBillingData()} />
    </div>
  );
}

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="app-stat-card">
    <p className="app-muted text-sm">{title}</p>
    <h3 className="mt-1 text-2xl font-semibold">{value}</h3>
  </div>
);

const displayTier = (tier: string) => tier.charAt(0) + tier.slice(1).toLowerCase();

const formatMoney = (currency: string, amount: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "code" }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
  : "Not available";

const formatMethod = (value: string) => value.replaceAll("_", " ").toLowerCase()
  .replace(/(^|\s)\S/g, (character) => character.toUpperCase());

const subscriptionStatus = (status: PaymentStatus) => status === "SETTLED"
  ? "Active"
  : status === "PAID_AWAITING_DELIVERY" || status === "DELIVERED_PENDING_SETTLEMENT"
    ? "Active · processing"
    : status.replaceAll("_", " ").toLowerCase();

export function BillingSnapshot({ overview, loading, error, onRetry }: {
  overview: BillingOverview | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) return <BillingSnapshotLoading />;
  if (error) return <section className="app-card" aria-labelledby="billing-overview-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 id="billing-overview-title" className="text-lg font-semibold">Billing overview</h2>
        <p className="app-muted mt-1 text-sm">{error}</p></div>
      <button type="button" className="app-button-secondary" onClick={onRetry}>Try again</button>
    </div>
  </section>;
  if (!overview) return null;

  const summary = overview.paidBills;
  const currentPlan = overview.currentPlan ?? null;
  return <section aria-labelledby="billing-overview-title" className="space-y-3">
    <div><h2 id="billing-overview-title" className="text-lg font-semibold">Billing overview</h2>
      <p className="app-muted mt-1 text-xs">Paid activity · All time</p></div>
    <div className="grid gap-3 lg:grid-cols-3">
      <OverviewCard icon={<ReceiptText size={18} />} eyebrow="Paid bills">
        <p className="text-2xl font-semibold tabular-nums">{summary?.count ?? 0}</p>
        {summary?.totals.length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {summary.totals.map((total) => <span key={total.currency} className="text-sm font-medium tabular-nums">
            {formatMoney(total.currency, total.amount)}
          </span>)}
        </div> : <p className="app-muted mt-2 text-sm">No successful payments yet.</p>}
      </OverviewCard>

      <OverviewCard icon={<CreditCard size={18} />} eyebrow="Current subscription">
        {currentPlan ? <>
          <div className="flex items-center justify-between gap-2"><p className="text-lg font-semibold">{displayTier(currentPlan.tier)}</p>
            <span className="rounded-full bg-[var(--app-success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--app-success-text)]">{subscriptionStatus(currentPlan.status)}</span></div>
          <p className="mt-1 text-sm font-medium">{formatMoney(currentPlan.currency, currentPlan.amountPaid)} <span className="app-muted font-normal">/ month</span></p>
          <p className="app-muted mt-2 flex items-center gap-1.5 text-xs"><CalendarClock size={14} />Access through {formatDate(currentPlan.periodEnd)}</p>
        </> : <><p className="font-medium">No active subscription</p><p className="app-muted mt-2 text-sm">Choose a plan when you are ready.</p></>}
        <DashboardBillingLink to="/dashboard/billing#current-subscription">Manage subscription</DashboardBillingLink>
      </OverviewCard>

      <OverviewCard icon={<WalletCards size={18} />} eyebrow="Latest successful payment">
        {summary?.latestPayment ? <LatestPayment payment={summary.latestPayment} />
          : <><p className="font-medium">No successful payment</p><p className="app-muted mt-2 text-sm">Completed payments will appear here.</p></>}
        <DashboardBillingLink to="/dashboard/billing#payment-history">View payment history</DashboardBillingLink>
      </OverviewCard>
    </div>
  </section>;
}

const OverviewCard = ({ icon, eyebrow, children }: { icon: React.ReactNode; eyebrow: string; children: React.ReactNode }) =>
  <article className="app-card flex min-h-48 flex-col p-4 sm:p-4">
    <div className="mb-3 flex items-center gap-2 text-[var(--app-accent)]"><span className="rounded-lg bg-[var(--app-accent-soft)] p-1.5">{icon}</span>
      <p className="app-muted text-xs font-medium uppercase tracking-wide">{eyebrow}</p></div>
    <div className="flex-1">{children}</div>
  </article>;

const DashboardBillingLink = ({ to, children }: { to: string; children: React.ReactNode }) =>
  <Link className="app-link mt-3 inline-flex items-center gap-1 text-sm font-medium" to={to}>{children}<ArrowRight size={14} /></Link>;

const LatestPayment = ({ payment }: { payment: PaymentHistoryItem }) => <>
  <p className="text-lg font-semibold tabular-nums">{formatMoney(payment.currency, payment.amount)}</p>
  <dl className="mt-2 space-y-1.5 text-xs">
    <div className="flex justify-between gap-3"><dt className="app-muted">Paid</dt><dd className="text-right">{formatDate(payment.completedAt ?? payment.updatedAt)}</dd></div>
    <div className="flex justify-between gap-3"><dt className="app-muted">Method</dt><dd className="text-right font-medium">{formatMethod(payment.paymentChannel)}</dd></div>
  </dl>
  <p className="app-muted mt-2 truncate font-mono text-xs" title={payment.merchantReference}>{payment.merchantReference}</p>
</>;

const BillingSnapshotLoading = () => <section className="space-y-3" aria-label="Loading billing overview" aria-busy="true">
  <div className="h-10 w-40 animate-pulse rounded-lg bg-[var(--app-surface-soft)]" />
  <div className="grid gap-3 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="app-card h-48 animate-pulse bg-[var(--app-surface-soft)]" />)}</div>
</section>;

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex min-h-[70vh] items-center justify-center px-4">
    <div className="app-danger-panel w-full max-w-md text-center">
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onRetry}
        className="app-button-secondary mt-4"
      >
        Try Again
      </button>
    </div>
  </div>
);
