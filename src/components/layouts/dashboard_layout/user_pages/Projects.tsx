import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL, { getErrorMessage } from "../../../../util/util";
import CreateProject from "./CreateProject";

interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  status: string;
  serviceCount: number;
}

interface ProjectsListResponse {
  total: number;
  projects: ProjectSummary[];
}

export default function Projects() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const logoutAndRedirect = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const fetchProjects = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        logoutAndRedirect();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/projects/list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401 || response.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to fetch projects"));
      }

      const result: ProjectsListResponse = await response.json();
      setProjects(result.projects);

    } catch (error) {
      console.error("Projects fetch failed:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  if (creating) {
    return (
      <CreateProject
        onSuccess={() => {
          setCreating(false);
          setLoading(true);
          void fetchProjects();
        }}
        onCancel={() => setCreating(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="app-loading-state">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Projects</h1>
        <p className="app-page-subtitle">Manage and view all your projects</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="app-button-primary"
        >
          Create Project
        </button>
      </div>

      {error && (
        <div className="app-danger-panel">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void fetchProjects();
              }}
              className="app-button-secondary"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="app-card text-center">
          <p className="app-muted">No projects found yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onManage={() => navigate(`/dashboard/projects/${project.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

const ProjectCard = ({ project, onManage }: { project: ProjectSummary; onManage: () => void }) => {
  return (
    <div className="app-card group transition-transform hover:-translate-y-0.5">

      <div className="flex items-center justify-between mb-3">
        <h3 className="truncate text-lg font-semibold">
          {project.name}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="app-muted mb-4 text-sm line-clamp-2">
        {project.description || "No description provided"}
      </p>

      <div className="flex items-center justify-between">
        <span className="app-muted text-sm">
          Services: <span className="font-medium text-inherit">{project.serviceCount}</span>
        </span>

        <button type="button" onClick={onManage} className="app-link">
          Manage →
        </button>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    ACTIVE: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-600",
    STOPPED: "border border-amber-500/25 bg-amber-500/10 text-amber-600",
    FAILED: "border border-rose-500/25 bg-rose-500/10 text-rose-500"
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] || "bg-[var(--app-status-muted-bg)] text-[var(--app-status-muted-text)]"}`}
    >
      {status}
    </span>
  );
};
