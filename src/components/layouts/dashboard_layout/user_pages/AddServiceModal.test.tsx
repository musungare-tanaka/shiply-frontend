import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, beforeEach, it, vi } from "vitest";
import AddServiceModal from "./AddServiceModal";
import { ToastContext } from "../../../../hooks/useToast";
import type { GitHubInstallationConnection, GitHubRepository, Project } from "../../../../lib/types";
import {
  analyzeGitHubRepository,
  createApplicationService,
  createDatabaseService,
  getGitHubBranches,
  getGitHubInstallUrl,
  getGitHubInstallations,
  getGitHubRepositoriesByInstallation,
  refreshGitHubInstallation,
} from "../../../../lib/api";

vi.mock("../../../../lib/api", () => ({
  analyzeGitHubRepository: vi.fn(),
  createApplicationService: vi.fn(),
  createDatabaseService: vi.fn(),
  getGitHubBranches: vi.fn(),
  getGitHubInstallUrl: vi.fn(),
  getGitHubInstallations: vi.fn(),
  getGitHubRepositoriesByInstallation: vi.fn(),
  refreshGitHubInstallation: vi.fn(),
}));

const mockedAnalyzeGitHubRepository = vi.mocked(analyzeGitHubRepository);
const mockedCreateApplicationService = vi.mocked(createApplicationService);
const mockedCreateDatabaseService = vi.mocked(createDatabaseService);
const mockedGetGitHubBranches = vi.mocked(getGitHubBranches);
const mockedGetGitHubInstallUrl = vi.mocked(getGitHubInstallUrl);
const mockedGetGitHubInstallations = vi.mocked(getGitHubInstallations);
const mockedGetGitHubRepositoriesByInstallation = vi.mocked(getGitHubRepositoriesByInstallation);
const mockedRefreshGitHubInstallation = vi.mocked(refreshGitHubInstallation);

const project: Project = {
  id: "project-1",
  name: "Shiply",
  userId: "user-1",
  createdAt: "2026-07-19T00:00:00Z",
  updatedAt: "2026-07-19T00:00:00Z",
  services: [],
};

const staleSelectionMessage = "The selected GitHub repository is no longer available. Choose another repository or reconnect GitHub.";

const installation: GitHubInstallationConnection = {
  installationId: 11,
  accountLogin: "shiply",
  accountType: "Organization",
  status: "ACTIVE",
  repositoryCount: 2,
  reconnectRequired: false,
};

const reconnectInstallation: GitHubInstallationConnection = {
  installationId: 22,
  accountLogin: "ops-team",
  accountType: "Organization",
  status: "ACTIVE",
  repositoryCount: 4,
  reconnectRequired: true,
};

const firstRepository: GitHubRepository = {
  repositoryId: 101,
  installationId: 11,
  installationAccountLogin: "shiply",
  installationAccountType: "Organization",
  owner: "shiply",
  name: "repo-one",
  fullName: "shiply/repo-one",
  cloneUrl: "https://github.com/shiply/repo-one.git",
  defaultBranch: "main",
  privateRepository: true,
  visibility: "private",
};

const secondRepository: GitHubRepository = {
  repositoryId: 102,
  installationId: 11,
  installationAccountLogin: "shiply",
  installationAccountType: "Organization",
  owner: "shiply",
  name: "repo-two",
  fullName: "shiply/repo-two",
  cloneUrl: "https://github.com/shiply/repo-two.git",
  defaultBranch: "develop",
  privateRepository: false,
  visibility: "public",
};

const showToast = vi.fn();

const renderModal = (theme: "light" | "dark" = "light") => render(
  <ToastContext.Provider value={{ showToast, dismissToast: vi.fn(), toasts: [] }}>
    <div className="authenticated-app" data-theme={theme}>
      <AddServiceModal project={project} onClose={vi.fn()} onCreated={vi.fn()} />
    </div>
  </ToastContext.Provider>,
);

const configureGitHubMocks = (repositories: GitHubRepository[] = [firstRepository, secondRepository]) => {
  mockedGetGitHubInstallations.mockResolvedValue([installation]);
  mockedGetGitHubRepositoriesByInstallation.mockResolvedValue({
    items: repositories,
    page: 0,
    size: 12,
    totalItems: repositories.length,
    totalPages: 1,
    hasNext: false,
  });
  mockedGetGitHubBranches.mockResolvedValue([
    { name: "main", sha: "abc123" },
    { name: "develop", sha: "def456" },
  ]);
  mockedAnalyzeGitHubRepository.mockResolvedValue({
    branch: "main",
    applicationRootDirectory: "",
    visibleEntries: ["package.json"],
    detectedProjectTypes: ["NODE"],
  });
  mockedCreateApplicationService.mockResolvedValue({} as never);
  mockedCreateDatabaseService.mockResolvedValue({} as never);
  mockedGetGitHubInstallUrl.mockResolvedValue({ url: "https://github.com/apps/shiply/installations/new" });
  mockedRefreshGitHubInstallation.mockResolvedValue(installation);
};

const openApplicationStep = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /application only/i }));
  await user.click(screen.getAllByRole("button", { name: /^next$/i }).at(-1)!);
  await screen.findByRole("listbox", { name: /github repositories/i });
};

const expectCloneUrlFields = (value: string) => {
  const inputs = screen.getAllByDisplayValue(value);
  expect(inputs.length).toBeGreaterThan(0);
  inputs.forEach((input) => expect(input).toHaveAttribute("readonly"));
};

describe("AddServiceModal", () => {
  beforeEach(() => {
    localStorage.clear();
    showToast.mockReset();
    vi.clearAllMocks();
    configureGitHubMocks();
  });

  it("renders token-based repository selection state in dark mode and auto-populates the clone URL", async () => {
    const user = userEvent.setup();
    renderModal("dark");

    await openApplicationStep(user);

    const selectedRepositoryButton = await screen.findByRole("option", { name: /shiply\/repo-one/i });
    expect(selectedRepositoryButton).toHaveClass("app-selectable-item");
    expect(selectedRepositoryButton).toHaveAttribute("data-selected", "true");
    expectCloneUrlFields("https://github.com/shiply/repo-one.git");
  });

  it("updates the selected repository and repository URL when another repository is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await openApplicationStep(user);
    await user.click(screen.getByRole("option", { name: /shiply\/repo-two/i }));

    expect(screen.getByRole("option", { name: /shiply\/repo-two/i })).toHaveAttribute("data-selected", "true");
    expectCloneUrlFields("https://github.com/shiply/repo-two.git");
    expect(screen.getByRole("combobox")).toHaveValue("develop");
  });

  it("limits branch selection to available repository branches", async () => {
    const user = userEvent.setup();
    renderModal();

    await openApplicationStep(user);

    const branchSelect = screen.getByRole("combobox");
    expect(branchSelect).toHaveValue("main");
    expect(screen.getByRole("option", { name: "main" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "develop" })).toBeInTheDocument();

    await user.selectOptions(branchSelect, "develop");

    expect(branchSelect).toHaveValue("develop");
  });

  it("supports keyboard navigation and selection inside the repository list", async () => {
    const user = userEvent.setup();
    renderModal();

    await openApplicationStep(user);

    const firstRepositoryButton = screen.getByRole("option", { name: /shiply\/repo-one/i });
    firstRepositoryButton.focus();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(screen.getByRole("option", { name: /shiply\/repo-two/i })).toHaveAttribute("data-selected", "true");
    expectCloneUrlFields("https://github.com/shiply/repo-two.git");
  });

  it("keeps manual repository URL entry editable and supports clearing a GitHub selection", async () => {
    const user = userEvent.setup();
    renderModal();

    await openApplicationStep(user);

    await user.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(screen.getByPlaceholderText(/select a github repository to populate the clone url/i)).toHaveValue("");

    await user.click(screen.getByRole("button", { name: /manual url/i }));
    const manualUrlInput = screen.getByPlaceholderText("https://github.com/user/repo");
    await user.clear(manualUrlInput);
    await user.type(manualUrlInput, "https://example.com/manual-repo.git");

    expect(manualUrlInput).toHaveValue("https://example.com/manual-repo.git");
  });

  it("submits repository searches and keeps pagination controls visible", async () => {
    const user = userEvent.setup();
    renderModal();

    await openApplicationStep(user);

    const searchInput = screen.getByPlaceholderText(/search repositories/i);
    await user.type(searchInput, "repo-two");

    await waitFor(() => {
      expect(mockedGetGitHubRepositoriesByInstallation).toHaveBeenLastCalledWith(11, "repo-two", 0, 12);
    });

    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /next/i }).at(0)).toBeDisabled();
  });

  it("shows disconnected and reconnect-required states for GitHub installations", async () => {
    const user = userEvent.setup();
    mockedGetGitHubInstallations.mockResolvedValueOnce([]);
    const firstRender = renderModal();

    await user.click(screen.getByRole("button", { name: /application only/i }));
    await user.click(screen.getAllByRole("button", { name: /^next$/i }).at(-1)!);
    expect(screen.getByText(/github is not connected yet/i)).toBeInTheDocument();

    firstRender.unmount();
    showToast.mockReset();
    mockedAnalyzeGitHubRepository.mockReset();
    mockedCreateApplicationService.mockReset();
    mockedCreateDatabaseService.mockReset();
    mockedGetGitHubBranches.mockReset();
    mockedGetGitHubInstallUrl.mockReset();
    mockedGetGitHubInstallations.mockReset();
    mockedGetGitHubRepositoriesByInstallation.mockReset();
    mockedRefreshGitHubInstallation.mockReset();
    mockedGetGitHubInstallations.mockResolvedValue([reconnectInstallation]);
    mockedRefreshGitHubInstallation.mockResolvedValue(reconnectInstallation);
    mockedGetGitHubRepositoriesByInstallation.mockResolvedValue({
      items: [{ ...firstRepository, installationId: 22, installationAccountLogin: "ops-team" }],
      page: 0,
      size: 12,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
    });
    mockedGetGitHubBranches.mockResolvedValue([{ name: "main", sha: "abc123" }]);
    mockedAnalyzeGitHubRepository.mockResolvedValue({
      branch: "main",
      applicationRootDirectory: "",
      visibleEntries: ["package.json"],
      detectedProjectTypes: ["NODE"],
    });
    mockedGetGitHubInstallUrl.mockResolvedValue({ url: "https://github.com/apps/shiply/installations/new" });
    renderModal();

    await screen.findByText(/ops-team/i);
    expect(screen.getByText(/^Reconnect$/)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /reconnect installation/i }).at(-1)!);
    await waitFor(() => {
      expect(mockedRefreshGitHubInstallation).toHaveBeenCalledWith(22);
    });
  });

  it("shows an empty repository state when no repositories match", async () => {
    const user = userEvent.setup();
    configureGitHubMocks([]);
    renderModal();

    await openApplicationStep(user);

    expect(screen.getByText(/no repositories found/i)).toBeInTheDocument();
    expect(screen.getByText(/try a different search term/i)).toBeInTheDocument();
  });

  it("blocks progression when the selected repository has no clone URL", async () => {
    const user = userEvent.setup();
    configureGitHubMocks([{ ...firstRepository, cloneUrl: "" }]);
    renderModal();

    await openApplicationStep(user);
    await user.click(screen.getAllByRole("button", { name: /^next$/i }).at(-1)!);

    expect(screen.getByText(/does not have a usable https clone url/i)).toBeInTheDocument();
  });

  it("clears a stale restored repository selection after a GitHub error", async () => {
    mockedGetGitHubRepositoriesByInstallation.mockResolvedValue({
      items: [secondRepository],
      page: 0,
      size: 12,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
    });
    mockedGetGitHubBranches.mockRejectedValue(new Error(staleSelectionMessage));

    localStorage.setItem("shiply.addServiceDraft.project-1", JSON.stringify({
      mode: "APPLICATION",
      step: 2,
      databaseInput: {
        name: "",
        databaseType: "POSTGRESQL",
        version: "15",
      },
      applicationInput: {
        name: "api",
        repositoryUrl: "https://github.com/shiply/repo-one.git",
        branch: "main",
        linkedDatabaseServiceId: null,
        githubInstallationId: 11,
        githubRepositoryId: 101,
        repositoryOwner: "shiply",
        repositoryName: "repo-one",
        defaultBranch: "main",
        applicationRootDirectory: "",
        runtimeTemplate: "AUTO",
        buildCommand: "",
        startCommand: "",
        exposedPort: 3000,
        environmentVariables: [],
        autoDeployEnabled: true,
      },
      repositorySource: "GITHUB_APP",
      selectedInstallationId: 11,
      selectedRepositoryId: 101,
      selectedRepositoryDetails: firstRepository,
    }));

    renderModal();

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(staleSelectionMessage, "error");
    });
    screen.getAllByPlaceholderText(/select a github repository to populate the clone url/i).forEach((input) => {
      expect(input).toHaveValue("");
    });
  });
});
