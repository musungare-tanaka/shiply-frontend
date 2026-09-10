import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBillingOverview, getDeployment, getPaymentHistory, getPaymentStatus, getProjectDeployments, initiatePayment, triggerDeploy } from "./api";

describe("deployment API calls", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.setItem("token", "test-token");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("triggers an authenticated deployment", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ deploymentId: "deploy-1" }) });

    await expect(triggerDeploy("service-1")).resolves.toEqual({ deploymentId: "deploy-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9091/api/v1/services/service-1/deploy",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }),
    );
  });

  it("loads an individual deployment and project history", async () => {
    const deployment = { deploymentId: "deploy-1", projectId: "project-1", serviceId: "service-1", serviceName: "API", status: "BUILDING", eventType: "deployment.build.started", timestamp: "2026-01-01T00:00:00Z", metadata: {} };
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => deployment });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [deployment] });

    await expect(getDeployment("deploy-1")).resolves.toEqual(deployment);
    await expect(getProjectDeployments("project-1")).resolves.toEqual([deployment]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "http://localhost:9091/api/v1/deployments/deploy-1",
      "http://localhost:9091/api/v1/projects/project-1/deployments",
    ]);
  });

  it("loads billing, initiates EcoCash, and reads Shiply payment status", async () => {
    const overview = { enabled: true, tiers: [], serviceCount: 0 };
    const payment = { merchantReference: "SHIPLY-1", status: "PENDING", amount: 130, currency: "ZWG" };
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => overview });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 201, json: async () => payment });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => payment });

    await expect(getBillingOverview()).resolves.toEqual(overview);
    await expect(initiatePayment("STARTER", "0771234567", true)).resolves.toEqual(payment);
    await expect(getPaymentStatus("SHIPLY-1")).resolves.toEqual(payment);

    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:9091/api/payments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tier: "STARTER", ecocashNumber: "0771234567", saveNumber: true }),
      }));
    expect(fetchMock.mock.calls[2][0]).toBe("http://localhost:9091/api/payments/SHIPLY-1");
  });

  it("loads authenticated payment history with encoded filters", async () => {
    const history = { content: [], page: 1, size: 20, totalElements: 0, totalPages: 0 };
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => history });

    await expect(getPaymentHistory({ page: 1, status: "REFUNDED", from: "2026-09-01", to: "2026-09-10" })).resolves.toEqual(history);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9091/api/payments/history?page=1&size=20&status=REFUNDED&from=2026-09-01&to=2026-09-10",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }),
    );
  });
});
