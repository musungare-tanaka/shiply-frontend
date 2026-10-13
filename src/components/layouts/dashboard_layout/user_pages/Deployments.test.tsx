import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import Deployments from "./Deployments";
import type { DeploymentHistoryItem } from "../../../../lib/types";

const mocked = vi.hoisted(() => ({
  useHistory: vi.fn(),
  useStatus: vi.fn(),
  getProjects: vi.fn(),
}));

vi.mock("../../../../hooks/useDeploymentHistory", () => ({ useDeploymentHistory: mocked.useHistory }));
vi.mock("../../../../hooks/useDeploymentStatus", () => ({
  isDeploymentTerminal: (status?: string | null) => ["RUNNING", "BUILD_FAILED", "DEPLOY_FAILED"].includes(status || ""),
  useDeploymentStatus: mocked.useStatus,
}));
vi.mock("../../../../lib/api", () => ({ getProjects: mocked.getProjects }));

const deployment: DeploymentHistoryItem = {
  deploymentId: "deploy-1", serviceId: "service-1", serviceName: "API", projectId: "project-1",
  projectName: "Website", status: "RUNNING", createdAt: "2026-01-01T00:00:00Z",
  finishedAt: "2026-01-01T00:01:00Z", appUrl: "https://app.example.com", failureReason: null,
};

const defaultHistory = () => ({
  deployments: [deployment], page: 0, totalPages: 1, totalElements: 1,
  isLoading: false, isLoadingMore: false, error: null, hasMore: false,
  retry: vi.fn(), loadMore: vi.fn(),
});

function LocationSearch() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

const renderPage = (initialEntry = "/dashboard/deployments") => render(
  <MemoryRouter initialEntries={[initialEntry]}><Deployments /><LocationSearch /></MemoryRouter>,
);

describe("Deployments page", () => {
  beforeEach(() => {
    mocked.useHistory.mockReset();
    mocked.useStatus.mockReset();
    mocked.getProjects.mockReset().mockResolvedValue([{ id: "project-1", name: "Website" }]);
    mocked.useStatus.mockReturnValue({ deployment: null, error: null, isLoading: false, isTracking: false });
  });

  it("shows user-wide deployment rows without requiring a project selection", async () => {
    mocked.useHistory.mockReturnValue(defaultHistory());
    mocked.useStatus.mockReturnValue({
      deployment: { ...deployment, status: "BUILDING", timestamp: "2026-01-01T00:00:30Z", metadata: {} },
      error: null, isLoading: false, isTracking: true,
    });
    renderPage();

    expect(await screen.findByText("API")).toBeInTheDocument();
    expect(screen.getAllByText("Website")).toHaveLength(2);
    expect(screen.getByText("Building")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /visit/i })).toHaveAttribute("href", "https://app.example.com");
    expect(screen.getByRole("combobox", { name: /project/i })).toHaveValue("");
  });

  it("uses the project deep link as the initial filter and updates the URL from the dropdown", async () => {
    mocked.useHistory.mockReturnValue(defaultHistory());
    renderPage("/dashboard/deployments?projectId=project-1");

    await waitFor(() => expect(screen.getByRole("combobox", { name: /project/i })).toHaveValue("project-1"));
    expect(mocked.useHistory).toHaveBeenCalledWith("project-1");
    fireEvent.change(screen.getByRole("combobox", { name: /project/i }), { target: { value: "" } });
    expect(screen.getByTestId("location-search")).toHaveTextContent("");
  });

  it("shows loading, empty, and retryable error states", () => {
    mocked.useHistory.mockReturnValue({ ...defaultHistory(), isLoading: true, deployments: [] });
    const { rerender } = renderPage();
    expect(screen.getByLabelText("Loading deployments")).toBeInTheDocument();

    mocked.useHistory.mockReturnValue({ ...defaultHistory(), deployments: [] });
    rerender(<MemoryRouter initialEntries={["/dashboard/deployments"]}><Deployments /><LocationSearch /></MemoryRouter>);
    expect(screen.getByText("No deployments yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to services" })).toHaveAttribute("href", "/dashboard/projects");

    const retry = vi.fn();
    mocked.useHistory.mockReturnValue({ ...defaultHistory(), deployments: [], error: "Unavailable", retry });
    rerender(<MemoryRouter initialEntries={["/dashboard/deployments"]}><Deployments /><LocationSearch /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
