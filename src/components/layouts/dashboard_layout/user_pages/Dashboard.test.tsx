import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { BillingOverview } from "../../../../lib/types";
import { BillingSnapshot } from "./Dashboard";

const overview: BillingOverview = {
  enabled: true,
  tiers: [],
  serviceCount: 1,
  currentPlan: {
    tier: "PRO",
    status: "SETTLED",
    amountPaid: 260,
    currency: "ZWG",
    purchasedAt: "2026-08-12T10:00:00Z",
    periodEnd: "2026-10-12T10:00:00Z",
    renewalMode: "MANUAL",
  },
  paidBills: {
    count: 3,
    totals: [{ currency: "USD", amount: 15 }, { currency: "ZWG", amount: 520 }],
    latestPayment: {
      merchantReference: "SHIPLY-LATEST",
      subscriptionTier: "PRO",
      amount: 260,
      currency: "ZWG",
      paymentChannel: "ECOCASH",
      status: "SETTLED",
      statusLabel: "Paid",
      message: "Payment completed",
      createdAt: "2026-09-12T10:00:00Z",
      updatedAt: "2026-09-12T10:01:00Z",
      completedAt: "2026-09-12T10:01:00Z",
    },
  },
};

describe("BillingSnapshot", () => {
  it("shows all-time currency totals, one subscription, and the latest successful payment", () => {
    render(<MemoryRouter><BillingSnapshot overview={overview} loading={false} error={null} onRetry={vi.fn()} /></MemoryRouter>);

    expect(screen.getByText("Paid activity · All time")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/USD\s*15\.00/)).toBeInTheDocument();
    expect(screen.getByText(/ZWG\s*520\.00/)).toBeInTheDocument();
    expect(screen.getAllByText("Pro")).toHaveLength(1);
    expect(screen.getByText("SHIPLY-LATEST")).toBeInTheDocument();
    expect(screen.getByText("Ecocash")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manage subscription/i })).toHaveAttribute("href", "/dashboard/billing#current-subscription");
    expect(screen.getByRole("link", { name: /view payment history/i })).toHaveAttribute("href", "/dashboard/billing#payment-history");
  });

  it("shows honest empty and error states", () => {
    const { rerender } = render(<MemoryRouter><BillingSnapshot overview={{ ...overview, currentPlan: null, paidBills: { count: 0, totals: [], latestPayment: null } }} loading={false} error={null} onRetry={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText("No active subscription")).toBeInTheDocument();
    expect(screen.getByText("No successful payments yet.")).toBeInTheDocument();
    expect(screen.getByText("No successful payment")).toBeInTheDocument();

    rerender(<MemoryRouter><BillingSnapshot overview={null} loading={false} error="Billing unavailable" onRetry={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText("Billing unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
