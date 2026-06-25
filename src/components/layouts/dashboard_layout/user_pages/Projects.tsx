import { FolderOpen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../../../../lib/api";
import type { Project } from "../../../../lib/types";
import { useToast } from "../../../../hooks/useToast";
import CreateProject from "./CreateProject";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchProjects = async () => {
    try {
      setError(null);
      setProjects(await getProjects());
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
        <div className="flex items-start gap-3 sm:items-center">
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-accent-soft)] p-2.5 text-[var(--app-accent)] sm:p-3">
            <FolderOpen size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="app-page-title">Your Projects</h1>
            <p className="app-page-subtitle">Manage application and database services for each hosted project.</p>
          </div>
        </div>
      </div>

      <div className="app-mobile-actions justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="app-button-primary"
        >
          <Plus size={18} />
          <span>New Project</span>
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
        <div className="app-empty-state min-h-[24rem]">
          <div className="app-empty-state-card">
            <div className="app-empty-state-icon">
              <FolderOpen size={32} />
            </div>
            <h2 className="text-2xl font-semibold">No projects yet</h2>
            <p className="app-page-subtitle">Create your first project to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onManage={() => navigate(`/dashboard/projects/${project.id}`)} />
          ))}
        </div>
      )}

      {creating ? (
        <CreateProject
          onSuccess={(projectId) => {
            setCreating(false);
            showToast("Project created");
            navigate(`/dashboard/projects/${projectId}`);
          }}
          onCancel={() => setCreating(false)}
        />
      ) : null}
    </div>
  );
}

const ProjectCard = ({ project, onManage }: { project: Project; onManage: () => void }) => {
  const projectMonogram = project.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onManage}
      className="group relative w-full overflow-hidden rounded-[1.75rem] border border-[var(--app-border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(246,248,252,0.98))] p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:border-[var(--app-border-strong)] hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_60%)]" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/70 bg-white text-sm font-semibold tracking-[0.2em] text-sky-600 shadow-sm">
            {projectMonogram || "PR"}
          </div>
          <h3 className="truncate pr-2 text-lg font-semibold text-slate-900 sm:text-xl">
            {project.name}
          </h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
            Open this workspace to manage services, configure links, and track the project setup.
          </p>
        </div>

        <div className="rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 transition-colors group-hover:bg-sky-100">
          Open
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Ready for services and deployments
          </p>
        </div>
        <span className="text-lg font-semibold text-slate-300 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </button>
  );
};
