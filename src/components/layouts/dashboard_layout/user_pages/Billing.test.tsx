import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PaymentStatus } from "../../../../lib/types";
import { PaymentHistory, PaymentState } from "./Billing";
import type { PaymentHistoryPage } from "../../../../lib/types";

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
  size: 20,
  totalElements: 21,
  totalPages: 2,
};

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
    render(<PaymentHistory history={history} loading={false} error="" onRetry={vi.fn()} onPageChange={onPageChange} />);
    expect(screen.getAllByText("SHIPLY-HISTORY-1")).toHaveLength(2);
    expect(screen.getAllByText("Paid")).toHaveLength(2);
    expect(screen.queryByText(/pollUrl|paynowReference|ecocashNumber/)).not.toBeInTheDocument();
    screen.getByRole("button", { name: "Next" }).click();
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
