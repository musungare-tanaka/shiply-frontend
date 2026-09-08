import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string; active?: boolean }> = {
  BUILDING: { label: "Building", className: "border-amber-500/25 bg-amber-500/10 text-amber-600", active: true },
  BUILD_SUCCEEDED: { label: "Build succeeded", className: "border-sky-500/25 bg-sky-500/10 text-sky-600", active: true },
  ORCHESTRATING: { label: "Deploying", className: "border-sky-500/25 bg-sky-500/10 text-sky-600", active: true },
  DEPLOYED: { label: "Deployed", className: "border-sky-500/25 bg-sky-500/10 text-sky-600", active: true },
  RUNNING: { label: "Live", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600" },
  BUILD_FAILED: { label: "Build failed", className: "border-rose-500/25 bg-rose-500/10 text-rose-500" },
  DEPLOY_FAILED: { label: "Deployment failed", className: "border-rose-500/25 bg-rose-500/10 text-rose-500" },
};

export const deploymentStatusLabel = (status?: string | null) => statusConfig[status || ""]?.label || status || "Starting";

export default function DeploymentStatusBadge({ status }: { status?: string | null }) {
  const config = statusConfig[status || ""] || {
    label: deploymentStatusLabel(status),
    className: "border border-[var(--app-border)] bg-[var(--app-surface-soft)] app-muted",
  };
  const Icon = config.active ? Loader2 : status?.includes("FAILED") ? XCircle : CheckCircle2;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      <Icon size={14} className={config.active ? "animate-spin" : undefined} />
      {config.label}
    </span>
  );
}
