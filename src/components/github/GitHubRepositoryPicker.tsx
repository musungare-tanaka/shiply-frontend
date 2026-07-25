import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Lock,
  RefreshCw,
  Search,
  Unplug,
} from "lucide-react";
import type { KeyboardEvent } from "react";
import { useRef } from "react";
import type { GitHubInstallationConnection, GitHubRepository } from "../../lib/types";
import GitHubIcon from "./GitHubIcon";

interface GitHubRepositoryPickerProps {
  title: string;
  description: string;
  installations: GitHubInstallationConnection[];
  installationsLoading: boolean;
  installationsError?: string | null;
  repositories: GitHubRepository[];
  repositoriesLoading: boolean;
  repositoryError?: string | null;
  repositoryQuery: string;
  repositoryPage: number;
  repositoryTotalPages: number;
  repositoryHasNext: boolean;
  selectedInstallationId: number | null;
  selectedRepositoryId: number | null;
  selectedRepository: GitHubRepository | null;
  onConnect: () => void;
  onReconnectInstallation: (installationId: number) => void;
  onSelectInstallation: (installationId: number) => void;
  onRepositoryQueryChange: (value: string) => void;
  onSelectRepository: (repository: GitHubRepository) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onClearSelection?: () => void;
  connectLabel?: string;
}

const GitHubRepositoryPicker = ({
  title,
  description,
  installations,
  installationsLoading,
  installationsError,
  repositories,
  repositoriesLoading,
  repositoryError,
  repositoryQuery,
  repositoryPage,
  repositoryTotalPages,
  repositoryHasNext,
  selectedInstallationId,
  selectedRepositoryId,
  selectedRepository,
  onConnect,
  onReconnectInstallation,
  onSelectInstallation,
  onRepositoryQueryChange,
  onSelectRepository,
  onPreviousPage,
  onNextPage,
  onClearSelection,
  connectLabel = "Connect GitHub",
}: GitHubRepositoryPickerProps) => {
  const repositoryButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleRepositoryKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    repository: GitHubRepository,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectRepository(repository);
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      repositoryButtonRefs.current[index + 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      repositoryButtonRefs.current[index - 1]?.focus();
    }
  };

  const selectedInstallation = installations.find((installation) => installation.installationId === selectedInstallationId) || null;
  const hasInstallations = installations.length > 0;
  const showDisconnectedState = !installationsLoading && !installationsError && !hasInstallations;
  const showRepositoryEmptyState = !repositoriesLoading && hasInstallations && repositories.length === 0;

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 sm:p-5">
      <div className="app-mobile-stack gap-4">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm">
              <GitHubIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{title}</p>
              <p className="app-muted mt-1 text-sm">{description}</p>
            </div>
          </div>
        </div>
        <button type="button" onClick={onConnect} className="app-button-primary w-full sm:w-fit">
          <GitHubIcon className="h-4 w-4" title="" />
          <span>{connectLabel}</span>
        </button>
      </div>

      {installationsError ? (
        <div className="app-danger-panel flex items-start gap-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{installationsError}</p>
        </div>
      ) : null}

      {installationsLoading ? (
        <div className="app-card flex items-center gap-3 text-sm">
          <RefreshCw size={16} className="animate-spin text-[var(--app-accent)]" />
          <p className="app-muted">Loading GitHub installations...</p>
        </div>
      ) : null}

      {showDisconnectedState ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface)] p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-danger-soft)] text-[var(--app-danger)]">
              <Unplug size={18} />
            </span>
            <div>
              <p className="font-semibold">GitHub is not connected yet</p>
              <p className="app-muted mt-1 text-sm">
                Install or reconnect the Shiply GitHub App to browse repositories and auto-fill the service configuration.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {hasInstallations ? (
        <div className="space-y-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">1. Choose an installation</p>
                <p className="app-muted text-sm">Select the GitHub account or organization that owns the repository.</p>
              </div>
              {selectedInstallation ? (
                <span className="app-selectable-badge">
                  {selectedInstallation.repositoryCount} repos
                </span>
              ) : null}
            </div>
            <div className="grid gap-3">
              {installations.map((installation) => {
                const isSelected = selectedInstallationId === installation.installationId;
                return (
                  <div
                    key={installation.installationId}
                    data-selected={isSelected}
                    className="app-selectable-item"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectInstallation(installation.installationId)}
                      aria-pressed={isSelected}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <GitHubIcon className="h-4 w-4 shrink-0" title="" />
                            <p className="app-selectable-title truncate">{installation.accountLogin}</p>
                            <span className="app-selectable-badge">{installation.accountType}</span>
                          </div>
                          <p className="app-muted mt-2 text-sm">
                            {installation.lastRepositorySyncAt
                              ? `Last synced ${new Date(installation.lastRepositorySyncAt).toLocaleString()}`
                              : "Repository sync pending"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isSelected ? <CheckCircle2 size={18} className="text-[var(--app-accent)]" /> : null}
                          {installation.reconnectRequired ? (
                            <span className="app-selectable-badge border-amber-200 bg-amber-50 text-amber-700">Reconnect</span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                    {installation.reconnectRequired ? (
                      <div className="mt-3 flex justify-start">
                        <button
                          type="button"
                          onClick={() => onReconnectInstallation(installation.installationId)}
                          className="app-button-secondary !min-h-0 !px-3 !py-2 text-xs"
                        >
                          <RefreshCw size={14} />
                          <span>Reconnect installation</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">2. Browse repositories</p>
                <p className="app-muted text-sm">Search by owner or repository name, then pick the service source.</p>
              </div>
              {selectedRepository && onClearSelection ? (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="app-button-ghost !min-h-0 !px-3 !py-2 text-xs"
                >
                  Clear selection
                </button>
              ) : null}
            </div>

            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 app-muted" />
              <input
                value={repositoryQuery}
                onChange={(event) => onRepositoryQueryChange(event.target.value)}
                className="app-input pl-10"
                placeholder="Search repositories"
              />
            </div>

            {repositoryError ? (
              <div className="app-danger-panel flex items-start gap-3 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{repositoryError}</p>
              </div>
            ) : null}

            <div
              className="grid gap-3"
              role="listbox"
              aria-label="GitHub repositories"
            >
              {repositoriesLoading ? (
                <div className="app-card flex items-center gap-3 text-sm">
                  <RefreshCw size={16} className="animate-spin text-[var(--app-accent)]" />
                  <p className="app-muted">Loading repositories...</p>
                </div>
              ) : null}

              {showRepositoryEmptyState ? (
                <div className="rounded-[1.5rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-5 text-sm">
                  <p className="font-semibold">No repositories found</p>
                  <p className="app-muted mt-1">
                    {selectedInstallation
                      ? "Try a different search term or refresh the installation if the repository list has changed."
                      : "Choose an installation to start browsing repositories."}
                  </p>
                </div>
              ) : null}

              {repositories.map((repository, index) => {
                const isSelected = selectedRepositoryId === repository.repositoryId;
                return (
                  <button
                    key={repository.repositoryId}
                    type="button"
                    role="option"
                    ref={(element) => {
                      repositoryButtonRefs.current[index] = element;
                    }}
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    tabIndex={isSelected || (!selectedRepositoryId && index === 0) ? 0 : -1}
                    onClick={() => onSelectRepository(repository)}
                    onKeyDown={(event) => handleRepositoryKeyDown(event, index, repository)}
                    className="app-selectable-item w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-start gap-2">
                          <GitHubIcon className="mt-0.5 h-4 w-4 shrink-0" title="" />
                          <div className="min-w-0">
                            <p className="app-selectable-title break-words">{repository.fullName}</p>
                            <p className="app-muted mt-1 text-sm">
                              Source account: {repository.installationAccountLogin}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="app-selectable-badge">{repository.visibility}</span>
                          <span className="app-selectable-badge inline-flex items-center gap-1">
                            <GitBranch size={12} />
                            <span>{repository.defaultBranch}</span>
                          </span>
                          {repository.privateRepository ? (
                            <span className="app-selectable-badge inline-flex items-center gap-1">
                              <Lock size={12} />
                              <span>Private</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {isSelected ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--app-accent)]" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="app-muted">
                {repositoryTotalPages > 0 ? `Page ${repositoryPage + 1} of ${repositoryTotalPages}` : "No repository pages yet"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="app-button-ghost !min-h-0 !px-3 !py-2"
                  disabled={repositoryPage === 0}
                  onClick={onPreviousPage}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="app-button-ghost !min-h-0 !px-3 !py-2"
                  disabled={!repositoryHasNext}
                  onClick={onNextPage}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitHubIcon className="h-4 w-4 text-[var(--app-text)]" title="" />
            <p className="font-semibold">Selected repository</p>
          </div>
          {selectedRepository ? <span className="app-selectable-badge">Ready</span> : null}
        </div>
        {selectedRepository ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">{selectedRepository.fullName}</p>
              <p className="app-muted text-sm">{selectedRepository.installationAccountLogin} installation</p>
            </div>
            <div className="space-y-1 sm:text-right">
              <p className="app-muted text-sm">Default branch</p>
              <p className="text-sm font-medium">{selectedRepository.defaultBranch}</p>
            </div>
            <div className="space-y-1">
              <p className="app-muted text-sm">Repository owner</p>
              <p className="text-sm font-medium">{selectedRepository.owner}</p>
            </div>
            <div className="space-y-1 sm:text-right">
              <p className="app-muted text-sm">Repository ID</p>
              <p className="text-sm font-medium">{selectedRepository.repositoryId}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="app-label mb-2">Clone URL</label>
              <input
                value={selectedRepository.cloneUrl}
                readOnly
                className="app-input"
                placeholder="Select a GitHub repository to populate the clone URL"
              />
            </div>
          </div>
        ) : (
          <p className="app-muted mt-3 text-sm">
            Select a GitHub repository to populate the clone URL and the related service settings automatically.
          </p>
        )}
      </section>
    </div>
  );
};

export default GitHubRepositoryPicker;
