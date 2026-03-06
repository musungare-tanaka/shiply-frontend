import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import BASE_URL from "../../../../util/util";

export default function ManageProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      navigate("/dashboard/projects");
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteError(error instanceof Error ? error.message : "Failed to delete project");
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    handleDeleteProject();
    setShowDeleteConfirm(false);
  };

  if (!projectId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">No project ID provided</p>
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

  return (
    <div className="space-y-6 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm sm:text-base w-fit"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Projects</span>
        </button>

        {/* Title and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
          {/* Action Buttons */}
          <div className="flex gap-2 flex-col sm:flex-row">
            <button
              onClick={() =>
                navigate(`/dashboard/projects/${projectId}/new-service`)
              }
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

      {/* Blank Content Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 min-h-[300px] flex items-center justify-center text-center">
        <span className="text-slate-500 text-sm sm:text-base">
          Project management content will appear here
        </span>
      </div>

      {/* Delete Confirmation Modal */}
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