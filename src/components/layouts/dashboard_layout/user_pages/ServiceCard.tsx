import { AppWindow, Database, GitBranch, Link2, Settings } from "lucide-react";
import type { Service } from "../../../../lib/types";
import StatusBadge from "./StatusBadge";

const ServiceCard = ({
  service,
  onOpenSettings,
}: {
  service: Service;
  onOpenSettings: (service: Service) => void;
}) => {
  const isDatabase = service.type === "DATABASE";

  return (
    <div className="app-card transition-transform hover:-translate-y-0.5 hover:border-[var(--app-border-strong)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`shrink-0 rounded-2xl border p-3 ${
              isDatabase
                ? "border-violet-500/20 bg-violet-500/10 text-violet-500"
                : "border-indigo-500/20 bg-indigo-500/10 text-indigo-500"
            }`}
          >
            {isDatabase ? <Database size={20} /> : <AppWindow size={20} />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold sm:text-lg">{service.name}</h3>
              <span className="rounded-full border border-[var(--app-border)] px-2 py-0.5 text-xs font-semibold app-muted">
                {isDatabase ? "DATABASE" : "APPLICATION"}
              </span>
            </div>
            <p className="app-muted mt-1 text-xs">
              Created {new Date(service.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="sm:self-start">
          <div className="flex items-center gap-2">
            <StatusBadge status={service.status} />
            <button
              type="button"
              onClick={() => onOpenSettings(service)}
              className="app-button-ghost !px-3 !py-2.5"
              aria-label={`Open settings for ${service.name}`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {isDatabase && service.databaseConfig ? (
        <div className="mt-5 space-y-2 text-sm">
          <p><span className="font-semibold">Database:</span> {service.databaseConfig.databaseType}</p>
          <p><span className="font-semibold">Version:</span> {service.databaseConfig.version}</p>
        </div>
      ) : null}

      {!isDatabase && service.applicationConfig ? (
        <div className="mt-5 space-y-3 text-sm">
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
            <p className="break-all text-sm font-medium sm:truncate">{service.applicationConfig.repositoryUrl}</p>
          </div>
          <div className="flex items-center gap-2 app-muted">
            <GitBranch size={16} />
            <span>{service.applicationConfig.branch}</span>
          </div>
          <div className="flex items-center gap-2 app-muted">
            <Link2 size={16} />
            <span>
              {service.applicationConfig.linkedDatabaseServiceName || "No database linked"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ServiceCard;
