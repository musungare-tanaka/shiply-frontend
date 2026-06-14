import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import BASE_URL, { getErrorMessage } from "../../../../util/util";

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  status: string;
  codeConfiguration?: unknown | null;
  databaseConfiguration?: unknown | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function ManageProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const logoutAndRedirect = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setLoadError("No project ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          logoutAndRedirect();
          return;
        }

        const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          logoutAndRedirect();
          return;
        }

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Failed to load project"));
        }

        const result: ProjectDetails = await response.json();
        setProject(result);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        logoutAndRedirect();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to delete project"));
      }

      navigate("/dashboard/projects");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete project");
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    handleDeleteProject();
    setShowDeleteConfirm(false);
  };

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

  const serviceCount = Number(Boolean(project.codeConfiguration)) + Number(Boolean(project.databaseConfiguration));

  return (
    <div className="space-y-6 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard/projects")}
          className="app-button-ghost w-fit text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Projects</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="app-page-title">{project.name}</h1>
            <p className="app-page-subtitle">
              {project.description || "No description provided for this project yet."}
            </p>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/projects/${projectId}/new-service`)}
              className="app-button-primary"
            >
              <Plus size={18} />
              <span>New Service</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="app-button-danger"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Status" value={project.status} />
        <StatCard title="Configured Services" value={serviceCount} />
        <StatCard title="Last Updated" value={project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : "Not available"} />
      </div>

      <div className="app-card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Project Overview</h2>
          <p className="app-muted mt-1 text-sm">
            Project ownership, listing, and deletion are live. Service provisioning is still coming soon.
          </p>
        </div>

        <div className="app-warning-panel">
          <p className="text-sm">
            The <span className="font-semibold">New Service</span> flow is visible for planning purposes, but it is not connected to backend provisioning yet.
          </p>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ backgroundColor: "var(--app-overlay)" }}
        >
          <div className="app-modal w-full rounded-t-2xl sm:max-w-sm sm:rounded-2xl">
            <h2 className="mb-2 text-lg font-bold sm:text-xl">Delete Project</h2>
            <p className="app-muted mb-6 text-sm sm:text-base">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="mb-4 text-xs font-medium text-[var(--app-danger)] sm:text-sm">
                {deleteError}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="app-button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="app-button-danger flex-1"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="app-stat-card">
    <p className="app-muted text-sm">{title}</p>
    <h3 className="mt-1 text-2xl font-semibold">{value}</h3>
  </div>
);
