import { useState } from "react";
import BASE_URL, { getErrorMessage } from "../../../../util/util";

interface CreateProjectProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateProject = ({ onSuccess, onCancel }: CreateProjectProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logoutAndRedirect = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You need to log in again");
      }

      const response = await fetch(`${BASE_URL}/api/projects/create-project`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, description })
      });

      if (response.status === 401 || response.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to create project"));
      }

      onSuccess();

    } catch (err) {
      setError(`Could not create project: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-card mx-auto mt-10 max-w-lg">
      <h2 className="mb-2 text-2xl font-semibold">
        Create New Project
      </h2>
      <p className="app-page-subtitle mt-0 mb-4">
        Set up a project container with a clear name and optional description.
      </p>

      {error && <p className="mb-3 text-sm font-medium text-[var(--app-danger)]">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="app-label">Project Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="app-input"
            placeholder="e.g. shiply-api"
          />
        </div>

        <div>
          <label className="app-label">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="app-input min-h-[110px]"
            placeholder="Add a short description for your team."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="app-button-primary flex-1"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="app-button-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
