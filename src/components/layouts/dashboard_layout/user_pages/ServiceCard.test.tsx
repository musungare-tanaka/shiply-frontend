import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ServiceCard from "./ServiceCard";
import { ToastContext } from "../../../../hooks/useToast";
import { useDeploymentStatus } from "../../../../hooks/useDeploymentStatus";
import type { Service } from "../../../../lib/types";

vi.mock("../../../../hooks/useDeploymentStatus", () => ({
  isDeploymentActive: () => false,
  useDeploymentStatus: vi.fn(),
}));

const mockedUseDeploymentStatus = vi.mocked(useDeploymentStatus);
const service: Service = {
  id: "service-1", projectId: "project-1", name: "API", type: "APP", status: "PROVISIONING",
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
};
const toastValue = { showToast: vi.fn(), dismissToast: vi.fn(), toasts: [] };
const deployment = (status: string) => ({
  deploymentId: "deploy-1", projectId: "project-1", serviceId: "service-1", serviceName: "API", status,
  eventType: "deployment.status", timestamp: "2026-01-01T00:00:00Z", metadata: {},
});

describe("ServiceCard terminal deployment refresh", () => {
  it("reports a terminal deployment once across rerenders and status updates", () => {
    const onDeploymentTerminal = vi.fn();
    mockedUseDeploymentStatus.mockReturnValue({ deployment: deployment("BUILDING"), error: null, isLoading: false, isTracking: true });
    const props = { service, onOpenSettings: vi.fn(), activeDeployment: deployment("BUILDING") as never, onDeploymentTerminal };
    const view = render(<ToastContext.Provider value={toastValue}><ServiceCard {...props} /></ToastContext.Provider>);

    mockedUseDeploymentStatus.mockReturnValue({ deployment: deployment("RUNNING"), error: null, isLoading: false, isTracking: false });
    act(() => view.rerender(<ToastContext.Provider value={toastValue}><ServiceCard {...props} /></ToastContext.Provider>));
    act(() => view.rerender(<ToastContext.Provider value={toastValue}><ServiceCard {...props} /></ToastContext.Provider>));

    expect(onDeploymentTerminal).toHaveBeenCalledTimes(1);
    expect(onDeploymentTerminal).toHaveBeenCalledWith("deploy-1", "RUNNING");
  });

  it("does not report a terminal deployment already present on first render", () => {
    const onDeploymentTerminal = vi.fn();
    mockedUseDeploymentStatus.mockReturnValue({ deployment: null, error: null, isLoading: false, isTracking: false });
    render(<ToastContext.Provider value={toastValue}><ServiceCard service={service} onOpenSettings={vi.fn()} activeDeployment={deployment("RUNNING") as never} onDeploymentTerminal={onDeploymentTerminal} /></ToastContext.Provider>);

    expect(onDeploymentTerminal).not.toHaveBeenCalled();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});
