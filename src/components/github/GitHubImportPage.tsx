import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getGitHubBranches,
  getGitHubInstallUrl,
  getGitHubRepositories,
  importGitHubProject,
  linkGitHubInstallation,
  unlinkGitHubInstallation,
} from "../../lib/api";
import type { GitHubBranch, GitHubInstallationLinkResponse, GitHubRepository } from "../../lib/types";

const GITHUB_RETURN_TO_KEY = "shiply.github.returnTo";

const GitHubImportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const installationIdParam = query.get("installation_id");
  const setupAction = query.get("setup_action");

  const [installation, setInstallation] = useState<GitHubInstallationLinkResponse | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [projectName, setProjectName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (installationIdParam) {
          const linked = await linkGitHubInstallation(Number(installationIdParam), setupAction);
          if (cancelled) {
            return;
          }
          setInstallation(linked);
          setRepositories(linked.repositories);
          if (linked.repositories[0]) {
            setSelectedRepositoryId(linked.repositories[0].repositoryId);
            setSelectedBranch(linked.repositories[0].defaultBranch);
            setProjectName(linked.repositories[0].name);
            setServiceName(linked.repositories[0].name);
          }
          const returnTo = window.localStorage.getItem(GITHUB_RETURN_TO_KEY);
          if (returnTo) {
            window.localStorage.removeItem(GITHUB_RETURN_TO_KEY);
            const separator = returnTo.includes("?") ? "&" : "?";
            const target = returnTo.includes("addService=1") ? returnTo : `${returnTo}${separator}addService=1`;
            navigate(target, { replace: true });
            return;
          }
          navigate(location.pathname, { replace: true });
          return;
        }

        const availableRepositories = await getGitHubRepositories();
        if (cancelled) {
          return;
        }
        setRepositories(availableRepositories);
        if (availableRepositories[0]) {
          setSelectedRepositoryId(availableRepositories[0].repositoryId);
          setSelectedBranch(availableRepositories[0].defaultBranch);
          setProjectName(availableRepositories[0].name);
          setServiceName(availableRepositories[0].name);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load GitHub repositories");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [installationIdParam, location.pathname, navigate, setupAction]);

  useEffect(() => {
    let cancelled = false;
    const loadBranches = async () => {
      if (!selectedRepositoryId) {
        setBranches([]);
        return;
      }

      try {
        const nextBranches = await getGitHubBranches(selectedRepositoryId);
        if (cancelled) {
          return;
        }
        setBranches(nextBranches);
        if (nextBranches.length > 0 && !nextBranches.some((branch) => branch.name === selectedBranch)) {
          setSelectedBranch(nextBranches[0].name);
        }
      } catch (branchError) {
        if (!cancelled) {
          setError(branchError instanceof Error ? branchError.message : "Failed to load GitHub branches");
        }
      }
    };

    void loadBranches();
    return () => {
      cancelled = true;
    };
  }, [selectedBranch, selectedRepositoryId]);

  const selectedRepository = repositories.find((repository) => repository.repositoryId === selectedRepositoryId) || null;

  const connectGitHub = async () => {
    try {
      const response = await getGitHubInstallUrl();
      window.location.href = response.url;
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Failed to open the GitHub installation flow");
    }
  };

  const handleImport = async () => {
    if (!selectedRepository) {
      setError("Select a repository first");
      return;
    }
    if (!projectName.trim() || !serviceName.trim() || !selectedBranch.trim()) {
      setError("Project name, service name, and branch are required");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const project = await importGitHubProject({
        projectName: projectName.trim(),
        serviceName: serviceName.trim(),
        installationId: selectedRepository.installationId,
        repositoryId: selectedRepository.repositoryId,
        branch: selectedBranch.trim(),
        autoDeploy,
      });
      setSuccess("Project imported successfully");
      navigate(`/dashboard/projects/${project.id}`, { replace: true });
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Failed to import the GitHub repository");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedRepository) {
      return;
    }
    try {
      await unlinkGitHubInstallation(selectedRepository.installationId);
      setRepositories([]);
      setBranches([]);
      setSelectedRepositoryId(null);
      setInstallation(null);
      setSuccess("GitHub installation disconnected");
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Failed to disconnect the GitHub installation");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">GitHub Import</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Import a repository into Shiply</h1>
            <p className="mt-2 text-sm text-slate-500">
              Link your GitHub App installation, choose a repository and branch, and create a Shiply project without exposing any GitHub credentials.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => void connectGitHub()} className="app-button-secondary">
              Manage GitHub access
            </button>
            <Link to="/dashboard/projects" className="app-button-ghost">
              Back to projects
            </Link>
          </div>
        </div>

        {loading ? <div className="mt-8 text-sm text-slate-500">Loading GitHub repositories...</div> : null}
        {error ? <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div> : null}
        {success ? <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        {!loading && repositories.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No GitHub repositories available yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Install the Shiply GitHub App for your account or organization, then come back here to import a repository.
            </p>
            <button type="button" onClick={() => void connectGitHub()} className="app-button-primary mt-6">
              Connect GitHub
            </button>
          </div>
        ) : null}

        {!loading && repositories.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-5">
              <div>
                <label className="app-label">Repository</label>
                <select
                  value={selectedRepositoryId || ""}
                  onChange={(event) => {
                    const repositoryId = Number(event.target.value);
                    const repository = repositories.find((item) => item.repositoryId === repositoryId) || null;
                    setSelectedRepositoryId(repositoryId);
                    if (repository) {
                      setSelectedBranch(repository.defaultBranch);
                      setProjectName(repository.name);
                      setServiceName(repository.name);
                    }
                  }}
                  className="app-input"
                >
                  {repositories.map((repository) => (
                    <option key={repository.repositoryId} value={repository.repositoryId}>
                      {repository.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="app-label">Branch</label>
                <select value={selectedBranch} onChange={(event) => setSelectedBranch(event.target.value)} className="app-input">
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="app-label">Project name</label>
                <input value={projectName} onChange={(event) => setProjectName(event.target.value)} className="app-input" />
              </div>

              <div>
                <label className="app-label">Application service name</label>
                <input value={serviceName} onChange={(event) => setServiceName(event.target.value)} className="app-input" />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                <input type="checkbox" checked={autoDeploy} onChange={(event) => setAutoDeploy(event.target.checked)} />
                Enable automatic deployments when GitHub push events match this branch
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Import summary</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><strong>Repository:</strong> {selectedRepository?.fullName || "None selected"}</p>
                <p><strong>Branch:</strong> {selectedBranch || "main"}</p>
                <p><strong>Visibility:</strong> {selectedRepository?.privateRepository ? "Private" : "Public"}</p>
                <p><strong>Auto deploy:</strong> {autoDeploy ? "Enabled" : "Disabled"}</p>
                {installation ? <p><strong>Installation:</strong> {installation.accountLogin}</p> : null}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button type="button" onClick={() => void handleImport()} className="app-button-primary" disabled={submitting}>
                  {submitting ? "Importing..." : "Create Shiply project"}
                </button>
                <button type="button" onClick={() => void connectGitHub()} className="app-button-secondary">
                  Reconnect GitHub
                </button>
                <button type="button" onClick={() => void handleDisconnect()} className="app-button-ghost">
                  Disconnect installation
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GitHubImportPage;
