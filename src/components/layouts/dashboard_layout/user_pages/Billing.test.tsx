import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PaymentStatus } from "../../../../lib/types";
import { PaymentState } from "./Billing";

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
      }} timedOut={false} onRefresh={vi.fn()} />);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText(/SHIPLY-1/)).toBeInTheDocument();
      if (status === "DISPUTED" || status === "REFUNDED" || status === "REVIEW_REQUIRED") {
        expect(container.firstChild).not.toHaveClass("bg-[var(--app-success-soft)]");
      }
    });
  }
});
