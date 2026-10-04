import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ManageProject from "./ManageProject";
import { ToastContext } from "../../../../hooks/useToast";
import { getProject } from "../../../../lib/api";
import type { Project } from "../../../../lib/types";

vi.mock("../../../../lib/api", () => ({ getProject: vi.fn() }));
vi.mock("../../../../hooks/useProjectDeployments", () => ({
  useProjectDeployments: () => ({ deployments: [{ deploymentId: "deploy-1", projectId: "project-1", serviceId: "service-1", serviceName: "API", status: "BUILDING", eventType: "deployment.build.started", timestamp: "2026-01-01T00:00:00Z", metadata: {} }], timelines: {}, isLoading: false, error: null }),
}));
vi.mock("./ServiceCard", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const { useEffect, useState } = React;
  return { default: ({ service, onDeploymentTerminal }: { service: { id: string; name: string; status: string }; onDeploymentTerminal: (deploymentId: string, status: string) => void }) => {
    const [token] = useState(() => `instance-${Math.random()}`);
    useEffect(() => { if (service.status === "PROVISIONING") onDeploymentTerminal("deploy-1", "RUNNING"); }, [service.status, onDeploymentTerminal]);
    return <div data-testid="service-card" data-instance={token}>{service.name}: {service.status}</div>;
  } };
});

const mockedGetProject = vi.mocked(getProject);
const project: Project = {
  id: "project-1", name: "Shiply", userId: "user-1", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
  services: [{ id: "service-1", projectId: "project-1", name: "API", type: "APP", status: "PROVISIONING", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" }],
};
const toastValue = { showToast: vi.fn(), dismissToast: vi.fn(), toasts: [] };

const renderPage = () => render(
  <ToastContext.Provider value={toastValue}>
    <MemoryRouter initialEntries={["/dashboard/projects/project-1"]}>
      <Routes><Route path="/dashboard/projects/:projectId" element={<ManageProject />} /></Routes>
    </MemoryRouter>
  </ToastContext.Provider>,
);

describe("ManageProject service refresh", () => {
  afterEach(() => vi.useRealTimers());

  it("retries while provisioning, stops once status changes, and keeps the same card mounted", async () => {
    vi.useFakeTimers();
    mockedGetProject.mockReset();
    mockedGetProject.mockResolvedValueOnce(project);
    mockedGetProject.mockResolvedValueOnce(project);
    mockedGetProject.mockResolvedValueOnce({ ...project, services: [{ ...project.services![0], status: "RUNNING" }] });

    const view = renderPage();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await Promise.resolve(); });
    expect(mockedGetProject).toHaveBeenCalledTimes(2);
    const card = screen.getByTestId("service-card");
    const instanceId = card.getAttribute("data-instance");

    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    await act(async () => { await Promise.resolve(); });
    expect(mockedGetProject).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId("service-card").getAttribute("data-instance")).toBe(instanceId);
    expect(screen.getByTestId("service-card")).toHaveTextContent("API: RUNNING");

    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(mockedGetProject).toHaveBeenCalledTimes(3);
    view.unmount();
  });
});
