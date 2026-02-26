import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";

export default function ManageProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/projects")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm sm:text-base"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to Projects</span>
          </button>
        </div>

        {/* Center */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center md:text-left">
          Manage Project
        </h1>

        {/* Right */}
        <button
          onClick={() =>
            navigate(`/dashboard/projects/${projectId}/new-service`)
          }
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition font-medium w-full md:w-auto"
        >
          <Plus size={18} />
          <span>New Service</span>
        </button>
      </div>

      {/* Blank Content Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 min-h-[300px] flex items-center justify-center text-center">
        <span className="text-slate-500 text-sm sm:text-base">
          Project management content will appear here
        </span>
      </div>
    </div>
  );
}