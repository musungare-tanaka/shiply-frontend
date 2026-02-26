import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ManageProject() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    if (!projectId) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-white">
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/dashboard/projects")}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Projects</span>
                </button>
            </div>

            {/* Blank Content Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[300px] flex items-center justify-center">
                <span className="text-slate-500 text-sm">
                    Project management content will appear here
                </span>
            </div>
        </div>
    );
}