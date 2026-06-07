import { ArrowLeft, Database, Github } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const plannedServices = [
  {
    title: "Database",
    description: "Provision managed data services for each project once backend orchestration is ready.",
    icon: Database,
  },
  {
    title: "GitHub Repository",
    description: "Connect source repositories and deployment settings when the build pipeline is live.",
    icon: Github,
  },
];

export default function NewServicePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/dashboard/projects/${projectId}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Project</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h1 className="text-2xl font-bold text-white">Service Provisioning Coming Soon</h1>
          <p className="text-amber-100/90 mt-3 leading-relaxed">
            This page stays visible in production so you can see the planned workflow, but no backend provisioning runs from here yet.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {plannedServices.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-800 p-3 text-indigo-300">
                  <Icon size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
