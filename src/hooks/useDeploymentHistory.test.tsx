import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDeploymentHistory } from "../lib/api";
import { useDeploymentHistory } from "./useDeploymentHistory";

vi.mock("../lib/api", () => ({ getDeploymentHistory: vi.fn() }));

const page = (number: number, ids: string[], totalPages = 2) => ({
  content: ids.map((deploymentId) => ({
    deploymentId, serviceId: `service-${deploymentId}`, serviceName: "API", projectId: "project-1",
    projectName: "Project", status: "RUNNING", createdAt: "2026-01-01T00:00:00Z", finishedAt: null,
    appUrl: null, failureReason: null,
  })),
  page: number, size: 20, totalElements: totalPages === 0 ? 0 : 2, totalPages,
});

describe("useDeploymentHistory", () => {
  const getHistory = vi.mocked(getDeploymentHistory);

  beforeEach(() => getHistory.mockReset());

  it("loads the first page for the selected project and appends the next page", async () => {
    getHistory.mockResolvedValueOnce(page(0, ["deploy-1"])).mockResolvedValueOnce(page(1, ["deploy-2"]));
    const { result } = renderHook(() => useDeploymentHistory("project-1"));

    await waitFor(() => expect(result.current.deployments.map((deployment) => deployment.deploymentId)).toEqual(["deploy-1"]));
    expect(getHistory).toHaveBeenNthCalledWith(1, { page: 0, size: 20, projectId: "project-1" });

    await act(async () => { await result.current.loadMore(); });
    expect(result.current.deployments.map((deployment) => deployment.deploymentId)).toEqual(["deploy-1", "deploy-2"]);
    expect(getHistory).toHaveBeenNthCalledWith(2, { page: 1, size: 20, projectId: "project-1" });
  });

  it("supports an empty page and retry after a failed load", async () => {
    getHistory.mockRejectedValueOnce(new Error("Unavailable")).mockResolvedValueOnce(page(0, [], 0));
    const { result } = renderHook(() => useDeploymentHistory());

    await waitFor(() => expect(result.current.error).toBe("Unavailable"));
    await act(async () => { await result.current.retry(); });
    expect(result.current.deployments).toEqual([]);
    expect(result.current.totalElements).toBe(0);
    expect(result.current.error).toBeNull();
  });
});
