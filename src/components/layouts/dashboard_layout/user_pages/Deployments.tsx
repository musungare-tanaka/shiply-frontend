import { AlertCircle, ExternalLink, History, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProject, getProjectDeployments } from "../../../../lib/api";
import { isDeploymentActive, useDeploymentStatus } from "../../../../hooks/useDeploymentStatus";
import type { DeploymentStatusResponse, Project } from "../../../../lib/types";
import DeploymentStatusBadge from "./DeploymentStatusBadge";

const formatTimestamp = (timestamp?: string | null) => {
  if (!timestamp) return "Waiting for first status event";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString(undefined, { timeZone: "Africa/Harare" });
};

const DeploymentRow = ({ initialDeployment }: { initialDeployment: DeploymentStatusResponse }) => {
  const { deployment, error, isLoading } = useDeploymentStatus(initialDeployment.deploymentId);
  const current = deployment || initialDeployment;
  const metadata = current.metadata || {};
  const errorMessage = typeof metadata.errorMessage === "string" ? metadata.errorMessage : error;
  const ingressHost = typeof metadata.ingressHost === "string" ? metadata.ingressHost : null;

  return (
    <article className="app-card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold">{current.serviceName || "Unnamed service"}</p>
          <p className="app-muted mt-1 break-all font-mono text-xs">{current.deploymentId}</p>
        </div>
        <DeploymentStatusBadge status={current.status} />
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="app-muted text-xs font-semibold uppercase tracking-wide">Last event</p>
          <p className="mt-1 break-all">{current.eventType || "Waiting for deployment event"}</p>
        </div>
        <div>
          <p className="app-muted text-xs font-semibold uppercase tracking-wide">Updated</p>
          <p className="mt-1">{formatTimestamp(current.timestamp)}</p>
        </div>
      </div>

      {isLoading && isDeploymentActive(current) ? <p className="app-muted text-xs">Refreshing deployment status...</p> : null}
      {errorMessage ? <p className="text-sm font-medium text-[var(--app-danger)]">{errorMessage}</p> : null}
      {ingressHost && current.status === "RUNNING" ? (
        <a className="app-link inline-flex items-center gap-1 text-sm" href={`https://${ingressHost}`} target="_blank" rel="noreferrer">
          Open live service <ExternalLink size={14} />
        </a>
      ) : null}

      {Object.keys(metadata).length > 0 ? (
        <details className="rounded-xl border border-[var(--app-border)] p-3">
          <summary className="cursor-pointer text-sm font-semibold">Deployment details</summary>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="app-muted font-semibold">{key}</dt>
                <dd className="mt-0.5 break-all">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </article>
  );
};

export default function Deployments() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId")?.trim();
  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<DeploymentStatusResponse[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void Promise.all([getProject(projectId), getProjectDeployments(projectId)])
      .then(([loadedProject, loadedDeployments]) => {
        if (cancelled) return;
        setProject(loadedProject);
        setDeployments(loadedDeployments);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Failed to load deployments");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="app-empty-state min-h-[24rem]">
        <div className="app-empty-state-card">
          <div className="app-empty-state-icon"><History size={32} /></div>
          <h1 className="text-2xl font-semibold">Choose a project</h1>
          <p className="app-page-subtitle">Open a project to view its deployment history.</p>
          <Link className="app-button-primary mt-5" to="/dashboard/projects">View projects</Link>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="app-loading-state">Loading deployments...</div>;

  if (error) {
    return (
      <div className="app-danger-panel flex items-center gap-3">
        <AlertCircle size={20} />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-start gap-3 sm:items-center">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-accent-soft)] p-2.5 text-[var(--app-accent)] sm:p-3"><Rocket size={24} /></div>
        <div className="min-w-0">
          <h1 className="app-page-title">Deployments{project ? ` for ${project.name}` : ""}</h1>
          <p className="app-page-subtitle">Monitor rollout activity and deployment history for this project.</p>
        </div>
      </div>

      {deployments.length === 0 ? (
        <div className="app-empty-state min-h-[20rem]">
          <div className="app-empty-state-card">
            <div className="app-empty-state-icon"><History size={32} /></div>
            <h2 className="text-2xl font-semibold">No deployments yet</h2>
            <p className="app-page-subtitle">Deploy an application service to see its progress here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">{deployments.map((deployment) => <DeploymentRow key={deployment.deploymentId} initialDeployment={deployment} />)}</div>
      )}
    </div>
  );
}
