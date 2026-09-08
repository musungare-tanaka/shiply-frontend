import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDeployment, getProjectDeployments, triggerDeploy } from "./api";

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
});
