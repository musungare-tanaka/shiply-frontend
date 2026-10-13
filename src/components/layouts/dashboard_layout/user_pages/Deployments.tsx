import { AlertCircle, ExternalLink, History, Rocket } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProjects } from "../../../../lib/api";
import type { DeploymentHistoryItem, Project } from "../../../../lib/types";
import { useDeploymentHistory } from "../../../../hooks/useDeploymentHistory";
import { isDeploymentTerminal, useDeploymentStatus } from "../../../../hooks/useDeploymentStatus";
import DeploymentStatusBadge from "./DeploymentStatusBadge";

const formatFullTimestamp = (value: string) => new Date(value).toLocaleString(undefined, { timeZone: "Africa/Harare" });

const formatRelativeTimestamp = (value: string, now: number) => {
  const seconds = Math.round((Date.parse(value) - now) / 1000);
  const absolute = Math.abs(seconds);
  const [amount, unit]: [number, Intl.RelativeTimeFormatUnit] = absolute < 60
    ? [seconds, "second"]
    : absolute < 3600 ? [Math.round(seconds / 60), "minute"]
      : absolute < 86400 ? [Math.round(seconds / 3600), "hour"]
        : [Math.round(seconds / 86400), "day"];
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(amount, unit);
};

const formatDuration = (startedAt: string, finishedAt: string | null, now: number) => {
  const elapsedSeconds = Math.max(0, Math.floor(((finishedAt ? Date.parse(finishedAt) : now) - Date.parse(startedAt)) / 1000));
  const days = Math.floor(elapsedSeconds / 86400);
  const hours = Math.floor((elapsedSeconds % 86400) / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const liveUrlFrom = (deployment: DeploymentHistoryItem, metadata: Record<string, unknown>) => {
  const host = typeof metadata.ingressHost === "string" ? metadata.ingressHost : null;
  if (!host) return deployment.appUrl || null;
  if (host.startsWith("https://") || host.startsWith("http://")) return host;
  return `${metadata.tlsEnabled === true ? "https" : "http"}://${host}`;
};

function DeploymentRow({ deployment }: { deployment: DeploymentHistoryItem }) {
  const initialTerminal = isDeploymentTerminal(deployment.status);
  const stream = useDeploymentStatus(initialTerminal ? null : deployment.deploymentId);
  const [now, setNow] = useState(() => Date.now());
  const status = stream.deployment?.status || deployment.status;
  const terminal = isDeploymentTerminal(status);
  const finishedAt = terminal ? stream.deployment?.timestamp || deployment.finishedAt || null : null;
  const metadata = stream.deployment?.metadata || {};
  const appUrl = liveUrlFrom(deployment, metadata);
  const failureReason = typeof metadata.errorMessage === "string"
    ? metadata.errorMessage
    : typeof metadata.message === "string" ? metadata.message : deployment.failureReason;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), terminal ? 60_000 : 1000);
    return () => window.clearInterval(timer);
  }, [terminal]);

  return (
    <tr className="border-t border-[var(--app-border)] align-middle">
      <td className="px-4 py-4">
        <div className="font-semibold">{deployment.serviceName || "Service"}</div>
        {status?.endsWith("_FAILED") && failureReason ? (
          <details className="mt-1 max-w-sm text-xs text-rose-500">
            <summary className="line-clamp-1 cursor-pointer">Failure details: {failureReason}</summary>
            <p className="mt-1 whitespace-normal break-words">{failureReason}</p>
          </details>
        ) : null}
      </td>
      <td className="px-4 py-4">{deployment.projectName || "Project"}</td>
      <td className="px-4 py-4"><DeploymentStatusBadge status={status} /></td>
      <td className="px-4 py-4">
        <time className="whitespace-nowrap" dateTime={deployment.createdAt} title={formatFullTimestamp(deployment.createdAt)}>
          {formatRelativeTimestamp(deployment.createdAt, now)}
        </time>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">{formatDuration(deployment.createdAt, finishedAt, now)}</td>
      <td className="px-4 py-4">
        {appUrl ? <a className="app-link inline-flex items-center gap-1 whitespace-nowrap text-sm" href={appUrl} target="_blank" rel="noreferrer">Visit <ExternalLink size={14} /></a> : <span className="app-muted">—</span>}
      </td>
    </tr>
  );
}

function DeploymentTableSkeleton() {
  return (
    <div className="app-card overflow-hidden" aria-label="Loading deployments" aria-busy="true">
      <div className="animate-pulse space-y-5 p-5">
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-10 rounded-lg bg-[var(--app-surface-soft)]" />)}
      </div>
    </div>
  );
}

export default function Deployments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId")?.trim() || "";
  const history = useDeploymentHistory(projectId || null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const result = await getProjects();
      setProjects(result);
      setProjectsError(null);
    } catch (error) {
      setProjectsError(error instanceof Error ? error.message : "Failed to load projects");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getProjects().then((result) => {
      if (!active) return;
      setProjects(result);
      setProjectsError(null);
    }).catch((error: unknown) => {
      if (!active) return;
      setProjectsError(error instanceof Error ? error.message : "Failed to load projects");
    });
    return () => { active = false; };
  }, []);

  const setProjectFilter = (nextProjectId: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextProjectId) next.set("projectId", nextProjectId);
    else next.delete("projectId");
    setSearchParams(next, { replace: true });
  };

  if (history.isLoading) return <DeploymentTableSkeleton />;

  if (history.error && !history.deployments.length) {
    return <div className="app-danger-panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><AlertCircle size={20} />{history.error}</div><button type="button" className="app-button-secondary" onClick={() => void history.retry()}>Retry</button></div>;
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Rocket size={26} />
        <div><h1 className="app-page-title">Deployments</h1><p className="app-page-subtitle">History across your projects and services.</p></div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          Project
          <select className="app-input min-w-48" value={projectId} onChange={(event) => setProjectFilter(event.target.value)}>
            <option value="">All projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        {projectsError ? <button type="button" className="app-link text-sm" onClick={() => void loadProjects()}>Could not load projects. Retry</button> : null}
      </div>

      {history.error ? <div className="app-danger-panel flex flex-wrap items-center justify-between gap-3"><span>{history.error}</span><button type="button" className="app-button-secondary" onClick={() => void history.retry()}>Retry</button></div> : null}

      {!history.deployments.length ? (
        <div className="app-empty-state min-h-[20rem]">
          <div className="app-empty-state-card">
            <div className="app-empty-state-icon"><History size={32} /></div>
            <h2 className="text-2xl font-semibold">No deployments yet</h2>
            <p className="app-page-subtitle">Deploy a service to see its history here.</p>
            <Link className="app-button-primary mt-5" to="/dashboard/projects">Go to services</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="app-card overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="app-muted bg-[var(--app-surface-soft)] text-xs uppercase tracking-wide">
                <tr><th className="px-4 py-3">Service</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Started</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Application</th></tr>
              </thead>
              <tbody>{history.deployments.map((deployment) => <DeploymentRow key={deployment.deploymentId} deployment={deployment} />)}</tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="app-muted text-sm">Showing {history.deployments.length} of {history.totalElements} deployments</p>
            {history.hasMore ? <button type="button" className="app-button-secondary" disabled={history.isLoadingMore} onClick={() => void history.loadMore()}>{history.isLoadingMore ? "Loading…" : "Load more"}</button> : null}
          </div>
        </>
      )}
    </div>
  );
}
