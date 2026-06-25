import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { ServiceStatus } from "../../../../lib/types";

const statusConfig: Record<ServiceStatus, { icon: ReactNode; className: string }> = {
  PENDING: {
    icon: <Clock size={14} />,
    className: "border border-amber-500/25 bg-amber-500/10 text-amber-600",
  },
  PROVISIONING: {
    icon: <Loader2 size={14} className="animate-spin" />,
    className: "border border-sky-500/25 bg-sky-500/10 text-sky-600",
  },
  RUNNING: {
    icon: <CheckCircle2 size={14} />,
    className: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-600",
  },
  FAILED: {
    icon: <XCircle size={14} />,
    className: "border border-rose-500/25 bg-rose-500/10 text-rose-500",
  },
};

const StatusBadge = ({ status }: { status: ServiceStatus }) => {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      {config.icon}
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
