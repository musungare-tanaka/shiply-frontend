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
      <div className="flex min-h-[60vh] items-center justify-center text-white">
        Loading project...
      </div>
    );
  }

  if (!projectId || loadError || !project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{loadError || "Project not found"}</p>
          <button
            onClick={() => navigate("/dashboard/projects")}
            className="text-indigo-400 hover:text-indigo-300"
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
          onClick={() => navigate("/dashboard/projects")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm sm:text-base w-fit"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Projects</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <p className="text-slate-400 mt-2">
              {project.description || "No description provided for this project yet."}
            </p>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row">
            <button
              onClick={() => navigate(`/dashboard/projects/${projectId}/new-service`)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition font-medium text-sm sm:text-base"
            >
              <Plus size={18} />
              <span>New Service</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2.5 rounded-lg transition font-medium text-sm sm:text-base"
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Project Overview</h2>
          <p className="text-slate-400 text-sm mt-1">
            Project ownership, listing, and deletion are live. Service provisioning is still coming soon.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-amber-200 text-sm">
            The <span className="font-semibold">New Service</span> flow is visible for planning purposes, but it is not connected to backend provisioning yet.
          </p>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-sm">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Delete Project</h2>
            <p className="text-slate-400 text-sm sm:text-base mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-red-400 text-xs sm:text-sm mb-4">{deleteError}</p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-white rounded-lg transition font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition font-medium text-sm sm:text-base"
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
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
    <p className="text-slate-400 text-sm">{title}</p>
    <h3 className="text-2xl font-semibold text-white mt-1">{value}</h3>
  </div>
);
