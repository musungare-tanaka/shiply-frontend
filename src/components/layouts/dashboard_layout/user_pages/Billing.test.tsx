import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentStatus } from "../../../../lib/types";
import Billing, { PaymentHistory, PaymentState, SubscriptionSummary } from "./Billing";
import type { PaymentHistoryPage } from "../../../../lib/types";

const apiMocks = vi.hoisted(() => ({
  getBillingOverview: vi.fn(),
  getPaymentHistory: vi.fn(),
  getPaymentStatus: vi.fn(),
  initiatePayment: vi.fn(),
}));

vi.mock("../../../../lib/api", () => apiMocks);

beforeEach(() => {
  vi.clearAllMocks();
});

const messages: Record<PaymentStatus, string> = {
  PENDING: "Waiting for customer payment",
  PAID_AWAITING_DELIVERY: "Payment confirmed and subscription activated",
  DELIVERED_PENDING_SETTLEMENT: "Payment received; settlement is pending",
  SETTLED: "Payment settled and subscription active",
  FAILED: "Payment failed",
  CANCELLED: "Payment was cancelled",
  DISPUTED: "Payment is disputed and under review",
  REFUNDED: "Payment was refunded",
  REVIEW_REQUIRED: "Payment is under review while confirmation is completed",
};

describe("PaymentState", () => {
  for (const [status, message] of Object.entries(messages) as [PaymentStatus, string][]) {
    it(`renders ${status} with its customer-safe message`, () => {
      const { container } = render(<PaymentState payment={{
        merchantReference: "SHIPLY-1", status, amount: 130, currency: "ZWG", message,
        statusLabel: message,
      }} timedOut={false} onRefresh={vi.fn()} />);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText(/SHIPLY-1/)).toBeInTheDocument();
      if (status === "SETTLED") expect(container.firstChild).toHaveClass("bg-[var(--app-success-soft)]");
      else expect(container.firstChild).not.toHaveClass("bg-[var(--app-success-soft)]");
    });
  }
});

const history: PaymentHistoryPage = {
  content: [{
    merchantReference: "SHIPLY-HISTORY-1",
    subscriptionTier: "PRO",
    amount: 260,
    currency: "ZWG",
    paymentChannel: "ECOCASH",
    status: "SETTLED",
    statusLabel: "Paid",
    message: "Your payment has settled successfully.",
    createdAt: "2026-09-10T10:00:00",
    updatedAt: "2026-09-10T10:01:00",
    completedAt: "2026-09-10T10:01:00",
  }],
  page: 0,
  size: 3,
  totalElements: 21,
  totalPages: 7,
};

describe("Billing layout and payment history loading", () => {
  it("requests the latest three transactions", async () => {
    apiMocks.getBillingOverview.mockResolvedValue({ enabled: false, tiers: [], serviceCount: 0 });
    apiMocks.getPaymentHistory.mockResolvedValue(history);

    render(<Billing />);

    await waitFor(() => expect(apiMocks.getPaymentHistory).toHaveBeenCalledWith({ page: 0, size: 3 }));
  });

  it("shows plans and EcoCash immediately for an unsubscribed customer", async () => {
    apiMocks.getBillingOverview.mockResolvedValue({ enabled: true, tiers: [
      { tier: "STARTER", usdPrice: 5, zwgPrice: 130, maxServices: 2 },
      { tier: "PRO", usdPrice: 10, zwgPrice: 260, maxServices: 5 },
    ], serviceCount: 0, currentPlan: null });
    apiMocks.getPaymentHistory.mockResolvedValue({ ...history, content: [], totalElements: 0, totalPages: 0 });

    render(<Billing />);

    expect(await screen.findByRole("button", { name: /Starter/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pro/ })).toBeInTheDocument();
    expect(screen.getByLabelText("EcoCash number")).toBeInTheDocument();
    expect(screen.getByText("No active plan")).toBeInTheDocument();
  });

  it("hides plan purchasing for a subscriber until Manage subscription is opened", async () => {
    const user = userEvent.setup();
    apiMocks.getBillingOverview.mockResolvedValue({ enabled: true, tiers: [
      { tier: "STARTER", usdPrice: 5, zwgPrice: 130, maxServices: 2 },
      { tier: "PRO", usdPrice: 10, zwgPrice: 260, maxServices: 5 },
    ], serviceCount: 2, activeTier: "PRO", currentPlan: {
      tier: "PRO", status: "SETTLED", amountPaid: 260, currency: "ZWG",
      purchasedAt: "2026-09-10T10:00:00Z", periodEnd: "2026-10-10T10:00:00Z", renewalMode: "MANUAL",
    } });
    apiMocks.getPaymentHistory.mockResolvedValue({ ...history, content: [], totalElements: 0, totalPages: 0 });

    render(<Billing />);

    const manage = await screen.findByRole("button", { name: "Manage subscription" });
    expect(manage).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("EcoCash number")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Starter/ })).not.toBeInTheDocument();

    await user.click(manage);
    expect(screen.getByLabelText("EcoCash number")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Starter/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pro/ })).toHaveClass("ring-2");
    expect(screen.getByRole("button", { name: "Hide plan options" })).toHaveAttribute("aria-expanded", "true");
  });
});

describe("PaymentHistory", () => {
  it("renders loading, empty, and error states", () => {
    const { rerender } = render(<PaymentHistory history={null} loading error="" onRetry={vi.fn()} onPageChange={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading payment history");
    rerender(<PaymentHistory history={{ ...history, content: [], totalElements: 0, totalPages: 0 }} loading={false} error="" onRetry={vi.fn()} onPageChange={vi.fn()} />);
    expect(screen.getByText("No payment attempts yet.")).toBeInTheDocument();
    rerender(<PaymentHistory history={null} loading={false} error="History unavailable" onRetry={vi.fn()} onPageChange={vi.fn()} />);
    expect(screen.getByText("History unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders responsive records and changes pages", async () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<PaymentHistory history={history} loading={false} error="" onRetry={vi.fn()} onPageChange={onPageChange} />);
    expect(screen.getAllByText("SHIPLY-HISTORY-1")).toHaveLength(2);
    expect(screen.getAllByText("Paid")).toHaveLength(2);
    expect(screen.getByText("21 transactions")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 7")).toBeInTheDocument();
    expect(screen.queryByText(/pollUrl|paynowReference|ecocashNumber/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    screen.getByRole("button", { name: "Next" }).click();
    expect(onPageChange).toHaveBeenCalledWith(1);

    rerender(<PaymentHistory history={{ ...history, page: 1 }} loading error="" onRetry={vi.fn()} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("disables next on the final page", () => {
    render(<PaymentHistory history={{ ...history, page: 6 }} loading={false} error="" onRetry={vi.fn()} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("hides pagination when there are three or fewer transactions", () => {
    render(<PaymentHistory history={{ ...history, totalElements: 3, totalPages: 1 }} loading={false} error="" onRetry={vi.fn()} onPageChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
  });
});

describe("SubscriptionSummary", () => {
  it("renders an essential summary and reveals secondary plan details", async () => {
    const user = userEvent.setup();
    render(<SubscriptionSummary currentPlan={{ tier: "PRO", status: "SETTLED", amountPaid: 260,
      currency: "ZWG", purchasedAt: "2026-09-10T10:00:00", periodEnd: "2026-10-10T10:00:00",
      renewalMode: "MANUAL" }} serviceCount={2} selectedTier="PRO" tierOption={{ zwgPrice: 275, maxServices: 5 }} />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("ZWG 275.00 / month")).toBeInTheDocument();
    expect(screen.getByText("Next billing / access date")).toBeInTheDocument();
    expect(screen.queryByText(/you will not be charged automatically/i)).not.toBeInTheDocument();

    const details = screen.getByRole("button", { name: /View details/ });
    expect(details).toHaveAttribute("aria-expanded", "false");
    await user.click(details);
    expect(details).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Up to 5 services")).toBeInTheDocument();
    expect(screen.getByText(/you will not be charged automatically/i)).toBeInTheDocument();
  });

  it("renders the free-tier state without an active plan", () => {
    render(<SubscriptionSummary currentPlan={null} serviceCount={0} selectedTier="STARTER" />);
    expect(screen.getByText("No active plan")).toBeInTheDocument();
    expect(screen.getByText(/free tier/i)).toBeInTheDocument();
  });
});
