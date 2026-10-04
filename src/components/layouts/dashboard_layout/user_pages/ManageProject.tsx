import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Layers, Plus, Rocket, Settings } from "lucide-react";
import { getProject } from "../../../../lib/api";
import { useProjectDeployments } from "../../../../hooks/useProjectDeployments";
import type { DeploymentStatusResponse, Project, Service } from "../../../../lib/types";
import AddServiceModal from "./AddServiceModal";
import ProjectSettingsModal from "./ProjectSettingsModal";
import ServiceCard from "./ServiceCard";
import ServiceSettingsModal from "./ServiceSettingsModal";

export default function ManageProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [activeService, setActiveService] = useState<Service | null>(null);
  const retryTimers = useRef(new Map<string, number[]>());
  const refreshInFlight = useRef(new Set<string>());
  const projectGeneration = useRef(0);
  const mounted = useRef(false);
  const activeDeploymentsById = useRef(new Map<string, string>());
  const liveDeployments = useProjectDeployments(projectId);
  const activeDeployments = liveDeployments.deployments.reduce<Record<string, DeploymentStatusResponse>>((result, deployment) => {
    if (!result[deployment.serviceId]) result[deployment.serviceId] = deployment; return result;
  }, {});
  activeDeploymentsById.current = new Map(liveDeployments.deployments.map((deployment) => [deployment.deploymentId, deployment.serviceId]));

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setLoadError("No project ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setLoadError(null);
      const result = await getProject(projectId);
      setProject(result);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    mounted.current = true;
    retryTimers.current.forEach((timers) => timers.forEach((timer) => window.clearTimeout(timer)));
    retryTimers.current.clear();
    refreshInFlight.current.clear();
    projectGeneration.current += 1;
    return () => {
      mounted.current = false;
      retryTimers.current.forEach((timers) => timers.forEach((timer) => window.clearTimeout(timer)));
      retryTimers.current.clear();
      refreshInFlight.current.clear();
      projectGeneration.current += 1;
    };
  }, [projectId]);

  const refreshServicesForTerminalDeployment = useCallback(async (deploymentId: string, status: string) => {
    if (!projectId || !["RUNNING", "BUILD_FAILED", "DEPLOY_FAILED"].includes(status)) return;
    const currentProjectId = projectId;
    const serviceId = activeDeploymentsById.current.get(deploymentId);
    if (!serviceId) return;
    const timerKey = `${currentProjectId}:${deploymentId}`;
    if (refreshInFlight.current.has(timerKey)) return;
    refreshInFlight.current.add(timerKey);

    const generation = projectGeneration.current;
    const refresh = async (attempt: number): Promise<void> => {
      try {
        const result = await getProject(currentProjectId);
        if (generation !== projectGeneration.current || !mounted.current) {
          refreshInFlight.current.delete(timerKey);
          return;
        }
        setProject((current) => {
          if (!current || current.id !== currentProjectId) return current;
          const refreshedById = new Map((result.services || []).map((service) => [service.id, service]));
          return { ...current, services: (current.services || []).map((service) => refreshedById.get(service.id) || service) };
        });

        const refreshedService = result.services?.find((service) => service.id === serviceId);
        const shouldRetry = refreshedService?.status === "PROVISIONING" && ["RUNNING", "DEPLOY_FAILED"].includes(status) && attempt < 3;
        if (shouldRetry) {
          const delays = [2000, 4000, 8000];
          const timer = window.setTimeout(() => {
            retryTimers.current.set(timerKey, (retryTimers.current.get(timerKey) || []).filter((scheduled) => scheduled !== timer));
            void refresh(attempt + 1);
          }, delays[attempt]);
          retryTimers.current.set(timerKey, [...(retryTimers.current.get(timerKey) || []), timer]);
        } else {
          refreshInFlight.current.delete(timerKey);
        }
      } catch {
        refreshInFlight.current.delete(timerKey);
      }
    };
    void refresh(0);
  }, [projectId]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("addService") === "1") {
      setShowAddService(true);
    }
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="app-loading-state">
        Loading project...
      </div>
    );
  }

  if (!projectId || loadError || !project) {
    return (
      <div className="app-loading-state">
        <div className="text-center">
          <p className="mb-4 text-sm font-medium text-[var(--app-danger)]">
            {loadError || "Project not found"}
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/projects")}
            className="app-link"
          >
            Go back to projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard/projects")}
          className="app-button-ghost w-full sm:w-fit text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          <span>Back to Projects</span>
        </button>

        <div className="app-mobile-stack">
          <div className="min-w-0">
            <h1 className="app-page-title">{project.name}</h1>
            <p className="app-page-subtitle">
              Services inside this project are represented as backend records and provisioning events for later infrastructure automation.
            </p>
          </div>

          <div className="app-mobile-actions">
            <button
              type="button"
              onClick={() => setShowProjectSettings(true)}
              className="app-button-ghost"
            >
              <Settings size={18} />
              <span>Project Settings</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/deployments?projectId=${encodeURIComponent(projectId)}`)}
              className="app-button-secondary"
            >
              <Rocket size={18} />
              <span>View Deployments</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddService(true)}
              className="app-button-primary"
            >
              <Plus size={18} />
              <span>Add Service</span>
            </button>
          </div>
        </div>
      </div>

      {(project.services?.length ?? 0) === 0 ? (
        <div className="app-empty-state min-h-[24rem]">
          <div className="app-empty-state-card">
            <div className="app-empty-state-icon">
              <Layers size={32} />
            </div>
            <h2 className="text-2xl font-semibold">No services yet</h2>
            <p className="app-page-subtitle">Add one to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(project.services || []).map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onOpenSettings={setActiveService}
              activeDeployment={activeDeployments[service.id]}
              onDeploymentTerminal={(deploymentId, status) => void refreshServicesForTerminalDeployment(deploymentId, status)}
            />
          ))}
        </div>
      )}

      {showAddService ? (
        <AddServiceModal
          project={project}
          onClose={() => setShowAddService(false)}
          onCreated={fetchProject}
          onUpgrade={() => navigate("/dashboard/billing?upgrade=1#current-subscription")}
        />
      ) : null}

      {showProjectSettings ? (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowProjectSettings(false)}
        />
      ) : null}

      {activeService ? (
        <ServiceSettingsModal
          service={activeService}
          onClose={() => setActiveService(null)}
          onDeleted={fetchProject}
        />
      ) : null}
    </div>
  );
}
