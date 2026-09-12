import { CalendarDays, FolderOpen, Loader2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteProject } from "../../../../lib/api";
import type { Project } from "../../../../lib/types";
import { useToast } from "../../../../hooks/useToast";

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
}

const ProjectSettingsModal = ({ project, onClose }: ProjectSettingsModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteProject(project.id);
      showToast("Project deleted");
      navigate("/dashboard/projects");
    } catch (error) {
      setIsDeleting(false);
      showToast(error instanceof Error ? error.message : "Failed to delete project", "error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="app-modal w-full max-w-lg rounded-[1.5rem] sm:rounded-[1.75rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="app-muted text-sm font-semibold">Project Settings</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{project.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="app-button-ghost !px-3 !py-3">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-accent-soft)] p-2.5 text-[var(--app-accent)]">
                <FolderOpen size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Project Details</p>
                <p className="app-muted break-all text-sm">ID: {project.id}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-[var(--app-accent)]" />
                <span>Created: {new Date(project.createdAt).toLocaleString(undefined, { timeZone: "Africa/Harare" })}</span>
              </p>
              <p className="flex items-start gap-2">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-[var(--app-accent)]" />
                <span>Updated: {new Date(project.updatedAt).toLocaleString(undefined, { timeZone: "Africa/Harare" })}</span>
              </p>
              <p className="app-muted">Services in project: {project.services?.length ?? 0}</p>
            </div>
          </div>

          <div className="app-danger-panel">
            <p className="text-sm font-semibold">Danger Zone</p>
            <p className="mt-2 text-sm">
              Deleting this project removes its service records from the dashboard.
            </p>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="app-button-danger mt-4 w-full"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              <span>Delete Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;
