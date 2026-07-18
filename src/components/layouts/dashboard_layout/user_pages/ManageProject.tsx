import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Layers, Plus, Settings } from "lucide-react";
import { getProject } from "../../../../lib/api";
import type { Project, Service } from "../../../../lib/types";
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
            />
          ))}
        </div>
      )}

      {showAddService ? (
        <AddServiceModal
          project={project}
          onClose={() => setShowAddService(false)}
          onCreated={fetchProject}
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
