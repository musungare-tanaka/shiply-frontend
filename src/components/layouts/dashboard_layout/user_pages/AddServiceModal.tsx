import {
  AppWindow,
  ArrowLeft,
  Database,
  FolderTree,
  GitBranch,
  Github,
  Layers,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Server,
  TableProperties,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import type {
  ApplicationEnvironmentVariable,
  CreateApplicationServiceInput,
  CreateDatabaseServiceInput,
  DatabaseType,
  GitHubBranch,
  GitHubInstallationConnection,
  GitHubRepository,
  Project,
} from "../../../../lib/types";
import { useToast } from "../../../../hooks/useToast";

type ServiceCreationMode = "DATABASE" | "APPLICATION";
type RepositorySource = "GITHUB_APP" | "MANUAL";

const GITHUB_RETURN_TO_KEY = "shiply.github.returnTo";
const GITHUB_DRAFT_PREFIX = "shiply.addServiceDraft.";

const databaseDefaults: Record<DatabaseType, string> = {
  POSTGRESQL: "15",
  MYSQL: "8.0",
  REDIS: "7.2",
  MONGODB: "7.0",
};

const databaseTypeMeta: Record<
  DatabaseType,
  {
    label: string;
    hint: string;
    accentClass: string;
    icon: typeof Database;
    mark: string;
  }
> = {
  POSTGRESQL: {
    label: "PostgreSQL",
    hint: "Relational database",
    accentClass: "text-sky-500",
    icon: Database,
    mark: "PG",
  },
  MYSQL: {
    label: "MySQL",
    hint: "Transactional SQL engine",
    accentClass: "text-amber-500",
    icon: TableProperties,
    mark: "MY",
  },
  REDIS: {
    label: "Redis",
    hint: "In-memory cache store",
    accentClass: "text-rose-500",
    icon: Server,
    mark: "RD",
  },
  MONGODB: {
    label: "MongoDB",
    hint: "Document database",
    accentClass: "text-emerald-500",
    icon: Layers,
    mark: "MG",
  },
};

interface AddServiceModalProps {
  project: Project;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

interface DraftPayload {
  mode: ServiceCreationMode | null;
  step: number;
  databaseInput: CreateDatabaseServiceInput;
  applicationInput: CreateApplicationServiceInput;
  repositorySource: RepositorySource;
  selectedInstallationId: number | null;
  selectedRepositoryId: number | null;
  selectedRepositoryDetails: GitHubRepository | null;
}

const buildDraftKey = (projectId: string) => `${GITHUB_DRAFT_PREFIX}${projectId}`;
const GITHUB_STALE_SELECTION_MESSAGE = "The selected GitHub repository is no longer available. Choose another repository or reconnect GitHub.";

const defaultApplicationInput: CreateApplicationServiceInput = {
  name: "",
  repositoryUrl: "",
  branch: "main",
  githubInstallationId: null,
  githubRepositoryId: null,
  repositoryOwner: null,
  repositoryName: null,
  defaultBranch: null,
  applicationRootDirectory: "",
  buildCommand: "",
  startCommand: "",
  exposedPort: 3000,
  environmentVariables: [],
  autoDeployEnabled: true,
};

const AddServiceModal = ({ project, onClose, onCreated }: AddServiceModalProps) => {
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<ServiceCreationMode | null>(null);
  const [repositorySource, setRepositorySource] = useState<RepositorySource>("GITHUB_APP");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [databaseDirty, setDatabaseDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [databaseInput, setDatabaseInput] = useState<CreateDatabaseServiceInput>({
    name: "",
    databaseType: "POSTGRESQL",
    version: databaseDefaults.POSTGRESQL,
  });
  const [applicationInput, setApplicationInput] = useState<CreateApplicationServiceInput>(defaultApplicationInput);
  const [installations, setInstallations] = useState<GitHubInstallationConnection[]>([]);
  const [installationsLoading, setInstallationsLoading] = useState(false);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedInstallationId, setSelectedInstallationId] = useState<number | null>(null);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<number | null>(null);
  const [selectedRepositoryDetails, setSelectedRepositoryDetails] = useState<GitHubRepository | null>(null);
  const [shouldAutoSelectRepository, setShouldAutoSelectRepository] = useState(true);
  const [repositoryQuery, setRepositoryQuery] = useState("");
  const [repositoryPage, setRepositoryPage] = useState(0);
  const [repositoryHasNext, setRepositoryHasNext] = useState(false);
  const [detectedProjectTypes, setDetectedProjectTypes] = useState<string[]>([]);
  const [visibleEntries, setVisibleEntries] = useState<string[]>([]);
  const selectedDatabaseType = databaseTypeMeta[databaseInput.databaseType];
  const draftKey = buildDraftKey(project.id);

  const selectedRepository = repositories.find((repository) => repository.repositoryId === selectedRepositoryId)
    || selectedRepositoryDetails;
  const supportsGitHub = mode === "APPLICATION";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) {
        return;
      }
      const draft = JSON.parse(raw) as DraftPayload;
      const nextMode = draft.mode === "DATABASE" || draft.mode === "APPLICATION" ? draft.mode : null;
      setMode(nextMode);
      setStep(nextMode ? Math.min(Math.max(draft.step || 1, 1), 3) : 1);
      setDatabaseInput(draft.databaseInput || {
        name: "",
        databaseType: "POSTGRESQL",
        version: databaseDefaults.POSTGRESQL,
      });
      setApplicationInput({
        ...defaultApplicationInput,
        ...draft.applicationInput,
        environmentVariables: draft.applicationInput?.environmentVariables || [],
      });
      setRepositorySource(draft.repositorySource || "GITHUB_APP");
      setSelectedInstallationId(draft.selectedInstallationId);
      setSelectedRepositoryId(draft.selectedRepositoryId);
      setSelectedRepositoryDetails(draft.selectedRepositoryDetails || null);
      setShouldAutoSelectRepository(!draft.selectedRepositoryId);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    const payload: DraftPayload = {
      mode,
      step,
      databaseInput,
      applicationInput,
      repositorySource,
      selectedInstallationId,
      selectedRepositoryId,
      selectedRepositoryDetails,
    };
    window.localStorage.setItem(draftKey, JSON.stringify(payload));
  }, [applicationInput, databaseInput, draftKey, mode, repositorySource, selectedInstallationId, selectedRepositoryDetails, selectedRepositoryId, step]);

  useEffect(() => {
    if (!supportsGitHub || repositorySource !== "GITHUB_APP") {
      return;
    }

    let cancelled = false;
    const loadInstallations = async () => {
      setInstallationsLoading(true);
      try {
        const nextInstallations = await getGitHubInstallations();
        if (cancelled) {
          return;
        }
        setInstallations(nextInstallations);
        if (!selectedInstallationId && nextInstallations[0]) {
          setSelectedInstallationId(nextInstallations[0].installationId);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error instanceof Error ? error.message : "Failed to load GitHub installations", "error");
        }
      } finally {
        if (!cancelled) {
          setInstallationsLoading(false);
        }
      }
    };

    void loadInstallations();
    return () => {
      cancelled = true;
    };
  }, [repositorySource, selectedInstallationId, showToast, supportsGitHub]);

  useEffect(() => {
    if (!selectedInstallationId || repositorySource !== "GITHUB_APP") {
      setRepositories([]);
      setRepositoryHasNext(false);
      return;
    }

    let cancelled = false;
    const loadRepositories = async () => {
      setRepositoriesLoading(true);
      try {
        const page = await getGitHubRepositoriesByInstallation(selectedInstallationId, repositoryQuery, repositoryPage, 12);
        if (cancelled) {
          return;
        }
        setRepositories(page.items);
        setRepositoryHasNext(page.hasNext);
        const matchingRepository = selectedRepositoryId
          ? page.items.find((repository) => repository.repositoryId === selectedRepositoryId) || null
          : null;

        if (matchingRepository) {
          setSelectedRepositoryDetails(matchingRepository);
        } else if (selectedRepositoryDetails && selectedRepositoryDetails.installationId !== selectedInstallationId) {
          clearGitHubSelection();
        } else if (!selectedRepositoryId && shouldAutoSelectRepository && page.items.length > 0) {
          const firstRepository = page.items[0];
          applyRepositorySelection(firstRepository);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error instanceof Error ? error.message : "Failed to load repositories", "error");
        }
      } finally {
        if (!cancelled) {
          setRepositoriesLoading(false);
        }
      }
    };

    void loadRepositories();
    return () => {
      cancelled = true;
    };
  }, [repositoryPage, repositoryQuery, repositorySource, selectedInstallationId, selectedRepositoryDetails, selectedRepositoryId, shouldAutoSelectRepository, showToast]);

  useEffect(() => {
    if (!selectedRepositoryId || repositorySource !== "GITHUB_APP") {
      setBranches([]);
      setDetectedProjectTypes([]);
      setVisibleEntries([]);
      return;
    }

    let cancelled = false;
    const loadBranches = async () => {
      setBranchesLoading(true);
      try {
        const nextBranches = await getGitHubBranches(selectedRepositoryId);
        if (cancelled) {
          return;
        }
        setBranches(nextBranches);
        if (nextBranches.length > 0 && !nextBranches.some((branch) => branch.name === applicationInput.branch)) {
          setApplicationInput((current) => ({ ...current, branch: nextBranches[0].name }));
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load branches";
          if (isRepositorySelectionStaleMessage(message)) {
            clearGitHubSelection();
          }
          showToast(message, "error");
        }
      } finally {
        if (!cancelled) {
          setBranchesLoading(false);
        }
      }
    };

    void loadBranches();
    return () => {
      cancelled = true;
    };
  }, [applicationInput.branch, repositorySource, selectedRepositoryId, showToast]);

  useEffect(() => {
    if (!selectedRepositoryId || repositorySource !== "GITHUB_APP") {
      return;
    }

    let cancelled = false;
    const analyze = async () => {
      setAnalysisLoading(true);
      try {
        const result = await analyzeGitHubRepository(
          selectedRepositoryId,
          applicationInput.branch,
          applicationInput.applicationRootDirectory,
        );
        if (cancelled) {
          return;
        }
        setDetectedProjectTypes(result.detectedProjectTypes);
        setVisibleEntries(result.visibleEntries);
      } catch {
        if (!cancelled) {
          setDetectedProjectTypes([]);
          setVisibleEntries([]);
          const message = error instanceof Error ? error.message : "";
          if (message && isRepositorySelectionStaleMessage(message)) {
            clearGitHubSelection();
            showToast(message, "error");
          }
        }
      } finally {
        if (!cancelled) {
          setAnalysisLoading(false);
        }
      }
    };

    void analyze();
    return () => {
      cancelled = true;
    };
  }, [applicationInput.applicationRootDirectory, applicationInput.branch, repositorySource, selectedRepositoryId]);

  useEffect(() => {
    if (!selectedRepository || repositorySource !== "GITHUB_APP") {
      return;
    }

    if (selectedInstallationId && selectedRepository.installationId !== selectedInstallationId) {
      clearGitHubSelection();
      return;
    }

    setApplicationInput((current) => ({
      ...current,
      githubInstallationId: selectedRepository.installationId,
      githubRepositoryId: selectedRepository.repositoryId,
      repositoryOwner: selectedRepository.owner,
      repositoryName: selectedRepository.name,
      defaultBranch: selectedRepository.defaultBranch,
      repositoryUrl: getRepositoryCloneUrl(selectedRepository),
    }));
  }, [repositorySource, selectedInstallationId, selectedRepository]);

  useEffect(() => {
    if (repositorySource === "MANUAL") {
      setApplicationInput((current) => ({
        ...current,
        githubInstallationId: null,
        githubRepositoryId: null,
        repositoryOwner: null,
        repositoryName: null,
        defaultBranch: null,
        autoDeployEnabled: false,
      }));
    }
  }, [repositorySource]);

  const validateStepTwo = () => {
    const nextErrors: Record<string, string> = {};

    if (mode === "DATABASE") {
      if (!databaseInput.name.trim()) {
        nextErrors.databaseName = "Database service name is required";
      }
      if (!databaseInput.version.trim()) {
        nextErrors.databaseVersion = "Database version is required";
      }
    }

    if (mode === "APPLICATION") {
      if (!applicationInput.name?.trim()) {
        nextErrors.applicationName = "Application service name is required";
      }
      if (repositorySource === "GITHUB_APP") {
        const gitHubSelectionError = validateGitHubSelection();
        if (gitHubSelectionError) {
          nextErrors[gitHubSelectionError.field] = gitHubSelectionError.message;
        }
      } else if (!(applicationInput.repositoryUrl || "").trim()) {
        nextErrors.repositoryUrl = "Repository URL is required";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearDraft = () => {
    window.localStorage.removeItem(draftKey);
    window.localStorage.removeItem(GITHUB_RETURN_TO_KEY);
  };

  const submit = async () => {
    if (!mode) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const applicationPayload: CreateApplicationServiceInput = {
      ...applicationInput,
      name: applicationInput.name?.trim(),
      branch: applicationInput.branch?.trim() || "main",
      repositoryUrl: (applicationInput.repositoryUrl || "").trim(),
      applicationRootDirectory: (applicationInput.applicationRootDirectory || "").trim() || null,
      buildCommand: (applicationInput.buildCommand || "").trim() || null,
      startCommand: (applicationInput.startCommand || "").trim() || null,
      environmentVariables: (applicationInput.environmentVariables || []).filter((variable) => variable.key.trim()),
      autoDeployEnabled: repositorySource === "GITHUB_APP" ? Boolean(applicationInput.autoDeployEnabled) : false,
    };

    if (repositorySource === "GITHUB_APP" && selectedRepository) {
      applicationPayload.githubInstallationId = selectedRepository.installationId;
      applicationPayload.githubRepositoryId = selectedRepository.repositoryId;
      applicationPayload.repositoryOwner = selectedRepository.owner;
      applicationPayload.repositoryName = selectedRepository.name;
      applicationPayload.defaultBranch = selectedRepository.defaultBranch;
      applicationPayload.repositoryUrl = selectedRepository.cloneUrl;
    } else {
      applicationPayload.githubInstallationId = null;
      applicationPayload.githubRepositoryId = null;
      applicationPayload.repositoryOwner = null;
      applicationPayload.repositoryName = null;
      applicationPayload.defaultBranch = null;
    }

    try {
      if (mode === "DATABASE") {
        await createDatabaseService(project.id, {
          ...databaseInput,
          name: databaseInput.name.trim(),
          version: databaseInput.version.trim(),
        });
        clearDraft();
        await onCreated();
        showToast("Database service created");
        onClose();
        return;
      }

      if (mode === "APPLICATION") {
        await createApplicationService(project.id, applicationPayload);
        clearDraft();
        await onCreated();
        showToast("Application service created");
        onClose();
        return;
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create service", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const connectGitHub = async () => {
    try {
      window.localStorage.setItem(GITHUB_RETURN_TO_KEY, `${window.location.pathname}${window.location.search}`);
      const response = await getGitHubInstallUrl();
      window.location.href = response.url;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to start the GitHub connection flow", "error");
    }
  };

  const reconnectInstallation = async (installationId: number) => {
    try {
      const refreshed = await refreshGitHubInstallation(installationId);
      setInstallations((current) => current.map((installation) => (
        installation.installationId === installationId ? refreshed : installation
      )));
      showToast("GitHub installation refreshed");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to refresh the GitHub installation", "error");
    }
  };

  const updateEnvironmentVariable = (index: number, patch: Partial<ApplicationEnvironmentVariable>) => {
    setApplicationInput((current) => {
      const nextVariables = [...(current.environmentVariables || [])];
      nextVariables[index] = { ...nextVariables[index], ...patch };
      return { ...current, environmentVariables: nextVariables };
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="app-modal w-full max-w-5xl rounded-[1.5rem] sm:rounded-[1.75rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
          <div className="min-w-0">
            <p className="app-muted text-sm font-semibold">Step {step} of 3</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Add Service</h2>
          </div>
          <button type="button" onClick={onClose} className="app-button-ghost !px-3 !py-3">
            <X size={18} />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { key: "DATABASE", title: "Database only", description: "Provision a managed database instance", icon: Database },
                { key: "APPLICATION", title: "Application only", description: "Deploy from GitHub or a Git URL", icon: AppWindow },
              ].map(({ key, title, description, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key as ServiceCreationMode)}
                  className={`app-card text-left transition-all ${
                    mode === key ? "border-indigo-500 bg-indigo-500/10" : ""
                  }`}
                >
                  <div className="mb-4 inline-flex rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-indigo-500">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="app-muted mt-2 text-sm">{description}</p>
                </button>
              ))}
            </div>

            <div className="app-mobile-actions justify-end">
              <button type="button" disabled={!mode} onClick={() => setStep(2)} className="app-button-primary">
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            {mode === "DATABASE" ? (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold">Database Configuration</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="app-label">Service Name</label>
                    <input
                      value={databaseInput.name}
                      onChange={(event) => setDatabaseInput((current) => ({ ...current, name: event.target.value }))}
                      className="app-input"
                      placeholder="e.g. shiply-db"
                    />
                    {errors.databaseName ? <p className="mt-2 text-sm text-rose-500">{errors.databaseName}</p> : null}
                  </div>
                  <div>
                    <label className="app-label">Database Type</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(Object.entries(databaseTypeMeta) as Array<[DatabaseType, typeof selectedDatabaseType]>).map(
                        ([type, meta]) => {
                          const Icon = meta.icon;
                          const isSelected = databaseInput.databaseType === type;

                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setDatabaseInput((current) => ({
                                  ...current,
                                  databaseType: type,
                                  version: databaseDirty ? current.version : databaseDefaults[type],
                                }));
                              }}
                              className={`rounded-2xl border p-4 text-left transition ${
                                isSelected ? "border-indigo-500 bg-indigo-500/10" : "border-[var(--app-border)] bg-[var(--app-surface-soft)]"
                              }`}
                            >
                              <div className={`mb-3 inline-flex rounded-2xl border border-current/20 p-3 ${meta.accentClass}`}>
                                <Icon size={18} />
                              </div>
                              <p className="font-semibold">{meta.label}</p>
                              <p className="app-muted mt-1 text-sm">{meta.hint}</p>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="app-label">Version</label>
                    <input
                      value={databaseInput.version}
                      onChange={(event) => {
                        setDatabaseDirty(true);
                        setDatabaseInput((current) => ({ ...current, version: event.target.value }));
                      }}
                      className="app-input"
                    />
                    {errors.databaseVersion ? <p className="mt-2 text-sm text-rose-500">{errors.databaseVersion}</p> : null}
                  </div>
                </div>
              </section>
            ) : null}

            {mode === "APPLICATION" ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Application Configuration</h3>
                  <div className="inline-flex rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-1">
                    <button
                      type="button"
                      onClick={() => setRepositorySource("GITHUB_APP")}
                      className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                        repositorySource === "GITHUB_APP" ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm" : "app-muted"
                      }`}
                    >
                      GitHub App
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepositorySource("MANUAL")}
                      className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                        repositorySource === "MANUAL" ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm" : "app-muted"
                      }`}
                    >
                      Manual URL
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="app-label">Service Name</label>
                    <input
                      value={applicationInput.name || ""}
                      onChange={(event) => setApplicationInput((current) => ({ ...current, name: event.target.value }))}
                      className="app-input"
                      placeholder="e.g. shiply-api"
                    />
                    {errors.applicationName ? <p className="mt-2 text-sm text-rose-500">{errors.applicationName}</p> : null}
                  </div>
                </div>

                {repositorySource === "GITHUB_APP" ? (
                  <div className="space-y-4 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Connect GitHub</p>
                        <p className="app-muted mt-1 text-sm">Choose an installation, search its repositories, then configure the selected branch.</p>
                      </div>
                      <button type="button" onClick={() => void connectGitHub()} className="app-button-primary">
                        <Github size={16} />
                        <span>Connect GitHub</span>
                      </button>
                    </div>

                    {installationsLoading ? <div className="app-muted text-sm">Loading GitHub installations...</div> : null}

                    {installations.length === 0 && !installationsLoading ? (
                      <div className="app-selectable-empty rounded-2xl border border-dashed p-5 text-sm">
                        No active GitHub installations are linked to this Shiply account yet.
                      </div>
                    ) : null}

                    {installations.length > 0 ? (
                      <div className="grid gap-3 lg:grid-cols-[0.9fr,1.1fr]">
                        <div className="space-y-3">
                          <label className="app-label">Installation or account</label>
                          <div className="space-y-2">
                            {installations.map((installation) => {
                              const isSelected = selectedInstallationId === installation.installationId;
                              return (
                                <button
                                  key={installation.installationId}
                                  type="button"
                                  onClick={() => {
                                    setSelectedInstallationId(installation.installationId);
                                    setShouldAutoSelectRepository(true);
                                    clearGitHubSelection({ disableAutoSelect: false });
                                    setRepositoryPage(0);
                                  }}
                                  aria-pressed={isSelected}
                                  data-selected={isSelected}
                                  className="app-selectable-item w-full text-left"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="app-selectable-title">{installation.accountLogin}</p>
                                      <p className="app-muted text-sm">{installation.accountType} installation</p>
                                      <p className="app-muted mt-2 text-xs">{installation.repositoryCount} repositories</p>
                                    </div>
                                    {installation.reconnectRequired ? (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void reconnectInstallation(installation.installationId);
                                        }}
                                        className="app-button-ghost !px-3 !py-2 text-xs"
                                      >
                                        <RefreshCw size={14} />
                                        <span>Reconnect</span>
                                      </button>
                                    ) : null}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {errors.githubInstallation ? <p className="text-sm text-rose-500">{errors.githubInstallation}</p> : null}
                        </div>

                        <div className="space-y-3">
                          <label className="app-label">Repository</label>
                          <div className="relative">
                            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 app-muted" />
                            <input
                              value={repositoryQuery}
                              onChange={(event) => {
                                setRepositoryQuery(event.target.value);
                                setRepositoryPage(0);
                              }}
                              className="app-input pl-10"
                              placeholder="Search repositories"
                            />
                          </div>
                          <div
                            className="app-selectable-list"
                            role="listbox"
                            aria-label="GitHub repositories"
                          >
                            {repositoriesLoading ? <div className="app-muted text-sm">Loading repositories...</div> : null}
                            {!repositoriesLoading && repositories.length === 0 ? (
                              <div className="app-selectable-empty text-sm">No repositories matched this installation and search.</div>
                            ) : null}
                            {repositories.map((repository, index) => {
                              const isSelected = selectedRepositoryId === repository.repositoryId;
                              return (
                                <button
                                  key={repository.repositoryId}
                                  type="button"
                                  id={`github-repository-option-${repository.repositoryId}`}
                                  role="option"
                                  ref={(element) => {
                                    repositoryButtonRefs.current[index] = element;
                                  }}
                                  aria-selected={isSelected}
                                  data-selected={isSelected}
                                  tabIndex={isSelected || (!selectedRepositoryId && index === 0) ? 0 : -1}
                                  onClick={() => applyRepositorySelection(repository)}
                                  onKeyDown={(event) => handleRepositoryKeyDown(event, index, repository)}
                                  className="app-selectable-item w-full text-left"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="app-selectable-title">{repository.fullName}</p>
                                      <p className="app-muted text-sm">{repository.defaultBranch} default branch</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      {repository.privateRepository ? <Lock size={14} className="app-muted" /> : null}
                                      <span className="app-selectable-badge">{repository.visibility}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              className="app-button-ghost"
                              disabled={repositoryPage === 0}
                              onClick={() => setRepositoryPage((current) => Math.max(current - 1, 0))}
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              className="app-button-ghost"
                              disabled={!repositoryHasNext}
                              onClick={() => setRepositoryPage((current) => current + 1)}
                            >
                              Next
                            </button>
                          </div>
                          {errors.githubRepository ? <p className="text-sm text-rose-500">{errors.githubRepository}</p> : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="app-label mb-0">Repository URL</label>
                          {selectedRepositoryId ? (
                            <button
                              type="button"
                              onClick={() => clearGitHubSelection()}
                              className="app-button-ghost !min-h-0 !px-3 !py-2 text-xs"
                            >
                              Clear selection
                            </button>
                          ) : null}
                        </div>
                        <div className="relative">
                          <GitBranch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 app-muted" />
                          <input
                            value={applicationInput.repositoryUrl || ""}
                            readOnly
                            className="app-input pl-10"
                            placeholder="Select a GitHub repository to populate the clone URL"
                          />
                        </div>
                        {errors.repositoryUrl ? <p className="mt-2 text-sm text-rose-500">{errors.repositoryUrl}</p> : null}
                      </div>
                      <div>
                        <label className="app-label">Branch</label>
                        <select
                          value={applicationInput.branch || ""}
                          onChange={(event) => setApplicationInput((current) => ({ ...current, branch: event.target.value }))}
                          className="app-input"
                          disabled={!selectedRepositoryId}
                        >
                          {branchesLoading ? <option>Loading branches...</option> : null}
                          {branches.map((branch) => (
                            <option key={branch.name} value={branch.name}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="app-label">Application Root Directory</label>
                        <input
                          value={applicationInput.applicationRootDirectory || ""}
                          onChange={(event) => setApplicationInput((current) => ({ ...current, applicationRootDirectory: event.target.value }))}
                          className="app-input"
                          placeholder="Leave blank for repo root"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="app-label">Repository URL</label>
                    <div className="relative">
                      <GitBranch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 app-muted" />
                      <input
                        value={applicationInput.repositoryUrl || ""}
                        onChange={(event) => setApplicationInput((current) => ({ ...current, repositoryUrl: event.target.value }))}
                        className="app-input pl-10"
                        placeholder="https://github.com/user/repo"
                      />
                    </div>
                    {errors.repositoryUrl ? <p className="mt-2 text-sm text-rose-500">{errors.repositoryUrl}</p> : null}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="app-label">Exposed Port</label>
                    <input
                      type="number"
                      min={1}
                      max={65535}
                      value={applicationInput.exposedPort || ""}
                      onChange={(event) => setApplicationInput((current) => ({
                        ...current,
                        exposedPort: event.target.value ? Number(event.target.value) : null,
                      }))}
                      className="app-input"
                    />
                  </div>
                  <div>
                    <label className="app-label">Build Command</label>
                    <input
                      value={applicationInput.buildCommand || ""}
                      onChange={(event) => setApplicationInput((current) => ({ ...current, buildCommand: event.target.value }))}
                      className="app-input"
                      placeholder="npm run build"
                    />
                  </div>
                  <div>
                    <label className="app-label">Start Command</label>
                    <input
                      value={applicationInput.startCommand || ""}
                      onChange={(event) => setApplicationInput((current) => ({ ...current, startCommand: event.target.value }))}
                      className="app-input"
                      placeholder="npm run start"
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Environment Variables</p>
                      <p className="app-muted text-sm">Secret values are hidden after save.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApplicationInput((current) => ({
                        ...current,
                        environmentVariables: [...(current.environmentVariables || []), { key: "", value: "", secret: true }],
                      }))}
                      className="app-button-ghost"
                    >
                      <Plus size={16} />
                      <span>Add Variable</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(applicationInput.environmentVariables || []).map((variable, index) => (
                      <div key={`${index}-${variable.key}`} className="grid gap-3 md:grid-cols-[1fr,1fr,auto,auto]">
                        <input
                          value={variable.key}
                          onChange={(event) => updateEnvironmentVariable(index, { key: event.target.value })}
                          className="app-input"
                          placeholder="KEY"
                        />
                        <input
                          value={variable.value || ""}
                          onChange={(event) => updateEnvironmentVariable(index, { value: event.target.value })}
                          className="app-input"
                          placeholder="value"
                          type={variable.secret ? "password" : "text"}
                        />
                        <label className="flex items-center gap-2 rounded-2xl border border-[var(--app-border)] px-3 text-sm">
                          <input
                            type="checkbox"
                            checked={variable.secret}
                            onChange={(event) => updateEnvironmentVariable(index, { secret: event.target.checked })}
                          />
                          Secret
                        </label>
                        <button
                          type="button"
                          onClick={() => setApplicationInput((current) => ({
                            ...current,
                            environmentVariables: (current.environmentVariables || []).filter((_, currentIndex) => currentIndex !== index),
                          }))}
                          className="app-button-ghost"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {repositorySource === "GITHUB_APP" ? (
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] px-4 py-3 text-sm app-muted">
                    <input
                      type="checkbox"
                      checked={Boolean(applicationInput.autoDeployEnabled)}
                      onChange={(event) => setApplicationInput((current) => ({ ...current, autoDeployEnabled: event.target.checked }))}
                    />
                    Enable automatic deployments for matching GitHub pushes
                  </label>
                ) : null}

                {repositorySource === "GITHUB_APP" && (analysisLoading || detectedProjectTypes.length > 0 || visibleEntries.length > 0) ? (
                  <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                    <div className="flex items-center gap-2">
                      <FolderTree size={16} className="text-[var(--app-accent)]" />
                      <p className="font-semibold">Repository signals</p>
                    </div>
                    {analysisLoading ? <p className="app-muted mt-2 text-sm">Inspecting repository contents...</p> : null}
                    {detectedProjectTypes.length > 0 ? (
                      <p className="app-muted mt-2 text-sm">Detected templates: {detectedProjectTypes.join(", ")}</p>
                    ) : null}
                    {visibleEntries.length > 0 ? (
                      <p className="app-muted mt-2 text-sm">Files in selected root: {visibleEntries.join(", ")}</p>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(1)} className="app-button-ghost">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStepTwo()) {
                    setStep(3);
                  }
                }}
                className="app-button-primary"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {mode === "DATABASE" ? (
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-sm font-semibold">Database</p>
                  <p className="mt-2 text-sm">{databaseInput.name}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-current/20 bg-white/70 ${selectedDatabaseType.accentClass}`}
                    >
                      <selectedDatabaseType.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedDatabaseType.label}</p>
                      <p className="app-muted text-sm">Version {databaseInput.version}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {mode === "APPLICATION" ? (
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-sm font-semibold">Application</p>
                  <p className="mt-2 text-sm">{applicationInput.name}</p>
                  <p className="app-muted mt-2 break-all text-sm">
                    {repositorySource === "GITHUB_APP"
                      ? selectedRepository?.fullName || "GitHub repository will be selected"
                      : applicationInput.repositoryUrl || ""}
                  </p>
                  <p className="app-muted mt-2 text-sm">Branch: {applicationInput.branch || "main"}</p>
                  <p className="app-muted mt-2 text-sm">
                    Root directory: {applicationInput.applicationRootDirectory?.trim() || "/"}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(2)} className="app-button-ghost" disabled={isSubmitting}>
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="button" onClick={() => void submit()} className="app-button-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Create Service</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AddServiceModal;
