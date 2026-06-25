import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { createProject } from "../../../../lib/api";

interface CreateProjectProps {
  onSuccess: (projectId: string) => void;
  onCancel: () => void;
}

const CreateProject = ({ onSuccess, onCancel }: CreateProjectProps) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedName = name.trim();
      if (!normalizedName) {
        setError("Project name is required");
        return;
      }

      const project = await createProject({ name: normalizedName });
      onSuccess(project.id);
    } catch (err) {
      setError(`Could not create project: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onCancel}
    >
      <div
        className="app-modal w-full max-w-lg rounded-[1.5rem] sm:rounded-[1.75rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold sm:text-2xl">Create New Project</h2>
            <p className="app-page-subtitle mt-2">
              Add a project container, then attach application and database services inside it.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="app-button-ghost !px-3 !py-3">
            <X size={18} />
          </button>
        </div>

        {error && <p className="mb-4 text-sm font-medium text-[var(--app-danger)]">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="app-label">Project Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="app-input"
              placeholder="e.g. school-management-system"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="app-button-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="app-button-primary flex-1"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
