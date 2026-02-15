import { useEffect, useState } from "react";
import BASE_URL from "../../../../util/util";

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

  const logoutAndRedirect = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const fetchProjects = async () => {
    try {
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
        throw new Error("Failed to fetch projects");
      }

      const result: ProjectsListResponse = await response.json();
      setProjects(result.projects);

    } catch (error) {
      console.error("Projects fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        <p className="text-slate-400">Manage and view all your projects</p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

const ProjectCard = ({ project }: { project: ProjectSummary }) => {
  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all">

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white truncate">
          {project.name}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {project.description || "No description provided"}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Services: <span className="text-white font-medium">{project.serviceCount}</span>
        </span>

        <button className="text-sm text-indigo-400 hover:text-indigo-300 transition">
          Manage →
        </button>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-500/15 text-green-400 border border-green-500/20",
    STOPPED: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
    FAILED: "bg-red-500/15 text-red-400 border border-red-500/20"
  };

  return (
    <span
      className={`text-xs px-2 py-1 rounded-md font-medium ${colors[status] || "bg-slate-700 text-slate-300"}`}
    >
      {status}
    </span>
  );
};
