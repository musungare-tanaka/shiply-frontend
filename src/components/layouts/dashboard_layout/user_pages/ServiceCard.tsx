import { AppWindow, Database, GitBranch, Rocket, Settings } from "lucide-react";
import { useState } from "react";
import { triggerDeploy } from "../../../../lib/api";
import type { DeploymentStatusResponse, Service } from "../../../../lib/types";
import { useToast } from "../../../../hooks/useToast";
import { isDeploymentActive, useDeploymentStatus } from "../../../../hooks/useDeploymentStatus";
import StatusBadge from "./StatusBadge";
import DeploymentStatusBadge from "./DeploymentStatusBadge";

const ServiceCard = ({
  service,
  onOpenSettings,
  activeDeployment,
}: {
  service: Service;
  onOpenSettings: (service: Service) => void;
  activeDeployment?: DeploymentStatusResponse;
}) => {
  const isDatabase = service.type === "DATABASE";
  const { showToast } = useToast();
  const [triggeredDeploymentId, setTriggeredDeploymentId] = useState<string | null>(null);
  const [isStartingDeployment, setIsStartingDeployment] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const deploymentId = triggeredDeploymentId || activeDeployment?.deploymentId;
  const { deployment, error: statusError, isLoading, isTracking } = useDeploymentStatus(deploymentId);
  const displayedDeployment = deployment || (triggeredDeploymentId ? null : activeDeployment) || null;
  const isDeploying = isStartingDeployment || isTracking || isDeploymentActive(activeDeployment);
  const metadata = displayedDeployment?.metadata || {};
  const errorMessage = typeof metadata.errorMessage === "string" ? metadata.errorMessage : deployError || statusError;
  const ingressHost = typeof metadata.ingressHost === "string" ? metadata.ingressHost : null;

  const handleDeploy = async () => {
    if (!service.id || isDeploying) return;

    setIsStartingDeployment(true);
    setDeployError(null);
    try {
      const response = await triggerDeploy(service.id);
      setTriggeredDeploymentId(response.deploymentId);
      showToast(`Deployment started for ${service.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start deployment";
      setDeployError(message);
      showToast(message, "error");
    } finally {
      setIsStartingDeployment(false);
    }
  };

  return (
    <div className="app-card transition-transform hover:-translate-y-0.5 hover:border-[var(--app-border-strong)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`shrink-0 rounded-2xl border p-3 ${
              isDatabase
                ? "border-violet-500/20 bg-violet-500/10 text-violet-500"
                : "border-indigo-500/20 bg-indigo-500/10 text-indigo-500"
            }`}
          >
            {isDatabase ? <Database size={20} /> : <AppWindow size={20} />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold sm:text-lg">{service.name}</h3>
              <span className="rounded-full border border-[var(--app-border)] px-2 py-0.5 text-xs font-semibold app-muted">
                {isDatabase ? "DATABASE" : "APPLICATION"}
              </span>
            </div>
            <p className="app-muted mt-1 text-xs">
              Created {new Date(service.createdAt).toLocaleDateString(undefined, { timeZone: "Africa/Harare" })}
            </p>
          </div>
        </div>

        <div className="sm:self-start">
          <div className="flex items-center gap-2">
            <StatusBadge status={service.status} />
            {!isDatabase ? (
              <button
                type="button"
                onClick={() => void handleDeploy()}
                disabled={!service.id || isDeploying}
                className="app-button-primary !px-3 !py-2.5 text-xs"
              >
                <Rocket size={15} />
                <span>{isDeploying ? "Deploying" : "Deploy"}</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenSettings(service)}
              className="app-button-ghost !px-3 !py-2.5"
              aria-label={`Open settings for ${service.name}`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {isDatabase && service.databaseConfig ? (
        <div className="mt-5 space-y-2 text-sm">
          <p><span className="font-semibold">Database:</span> {service.databaseConfig.databaseType}</p>
          <p><span className="font-semibold">Version:</span> {service.databaseConfig.version}</p>
        </div>
      ) : null}

      {!isDatabase && service.applicationConfig ? (
        <div className="mt-5 space-y-3 text-sm">
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
            <p className="break-all text-sm font-medium sm:truncate">{service.applicationConfig.repositoryUrl}</p>
          </div>
          <div className="flex items-center gap-2 app-muted">
            <GitBranch size={16} />
            <span>{service.applicationConfig.branch}</span>
          </div>
        </div>
      ) : null}

      {!isDatabase && (deploymentId || deployError) ? (
        <div className="mt-5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">Latest deployment</span>
            <DeploymentStatusBadge status={displayedDeployment?.status} />
          </div>
          {isLoading && !displayedDeployment ? <p className="app-muted mt-2 text-xs">Preparing deployment status...</p> : null}
          {displayedDeployment?.eventType ? <p className="app-muted mt-2 text-xs">{displayedDeployment.eventType}</p> : null}
          {errorMessage ? <p className="mt-2 text-xs font-medium text-[var(--app-danger)]">{errorMessage}</p> : null}
          {ingressHost && displayedDeployment?.status === "RUNNING" ? (
            <a className="app-link mt-2 inline-block text-xs" href={`https://${ingressHost}`} target="_blank" rel="noreferrer">
              Open live service
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ServiceCard;
