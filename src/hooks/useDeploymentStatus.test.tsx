import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getDeployment } from "../lib/api";
import { useDeploymentStatus } from "./useDeploymentStatus";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return { ...actual, getDeployment: vi.fn() };
});

const mockedGetDeployment = vi.mocked(getDeployment);
const deployment = (status: string) => ({
  deploymentId: "deploy-1",
  projectId: "project-1",
  serviceId: "service-1",
  serviceName: "API",
  status,
  eventType: "deployment.build.started",
  timestamp: "2026-01-01T00:00:00Z",
  metadata: {},
});

describe("useDeploymentStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedGetDeployment.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries an initial 404 and stops after a terminal status", async () => {
    mockedGetDeployment.mockRejectedValueOnce(new ApiError("Not found", 404));
    mockedGetDeployment.mockResolvedValueOnce(deployment("RUNNING"));
    const { result } = renderHook(() => useDeploymentStatus("deploy-1"));

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(mockedGetDeployment).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isTracking).toBe(true);

    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(result.current.deployment?.status).toBe("RUNNING");
    expect(result.current.isTracking).toBe(false);

    await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
    expect(mockedGetDeployment).toHaveBeenCalledTimes(2);
  });

  it("cleans up polling after unmount", async () => {
    mockedGetDeployment.mockResolvedValue(deployment("BUILDING"));
    const { unmount } = renderHook(() => useDeploymentStatus("deploy-unmount"));

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(mockedGetDeployment).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(mockedGetDeployment).toHaveBeenCalledTimes(1);
  });
});
