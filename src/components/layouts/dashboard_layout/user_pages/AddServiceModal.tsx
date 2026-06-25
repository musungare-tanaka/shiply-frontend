import { AppWindow, ArrowLeft, Database, GitBranch, Layers, Link2, Loader2, Server, TableProperties, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createApplicationService, createDatabaseService } from "../../../../lib/api";
import type {
  CreateApplicationServiceInput,
  CreateDatabaseServiceInput,
  DatabaseType,
  Project,
} from "../../../../lib/types";
import { useToast } from "../../../../hooks/useToast";

type ServiceCreationMode = "DATABASE" | "APPLICATION" | "BOTH";

const databaseDefaults: Record<DatabaseType, string> = {
  POSTGRESQL: "15",
  MYSQL: "8.0",
  REDIS: "7.2",
  MONGODB: "7.0",
};

const databaseTypeMeta: Record<
  DatabaseType,
  {
    label: string;
    hint: string;
    accentClass: string;
    icon: typeof Database;
    mark: string;
  }
> = {
  POSTGRESQL: {
    label: "PostgreSQL",
    hint: "Relational database",
    accentClass: "text-sky-500",
    icon: Database,
    mark: "PG",
  },
  MYSQL: {
    label: "MySQL",
    hint: "Transactional SQL engine",
    accentClass: "text-amber-500",
    icon: TableProperties,
    mark: "MY",
  },
  REDIS: {
    label: "Redis",
    hint: "In-memory cache store",
    accentClass: "text-rose-500",
    icon: Server,
    mark: "RD",
  },
  MONGODB: {
    label: "MongoDB",
    hint: "Document database",
    accentClass: "text-emerald-500",
    icon: Layers,
    mark: "MG",
  },
};

interface AddServiceModalProps {
  project: Project;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

const AddServiceModal = ({ project, onClose, onCreated }: AddServiceModalProps) => {
  const { showToast } = useToast();
  const databaseServices = useMemo(
    () => (project.services || []).filter((service) => service.type === "DATABASE"),
    [project.services],
  );
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<ServiceCreationMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [databaseDirty, setDatabaseDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [databaseInput, setDatabaseInput] = useState<CreateDatabaseServiceInput>({
    name: "",
    databaseType: "POSTGRESQL",
    version: databaseDefaults.POSTGRESQL,
  });
  const [applicationInput, setApplicationInput] = useState<CreateApplicationServiceInput>({
    name: "",
    repositoryUrl: "",
    branch: "main",
    linkedDatabaseServiceId: null,
  });
  const selectedDatabaseType = databaseTypeMeta[databaseInput.databaseType];

  const validateStepTwo = () => {
    const nextErrors: Record<string, string> = {};

    if (mode === "DATABASE" || mode === "BOTH") {
      if (!databaseInput.name.trim()) {
        nextErrors.databaseName = "Database service name is required";
      }
      if (!databaseInput.version.trim()) {
        nextErrors.databaseVersion = "Database version is required";
      }
    }

    if (mode === "APPLICATION" || mode === "BOTH") {
      if (!applicationInput.name.trim()) {
        nextErrors.applicationName = "Application service name is required";
      }
      if (!applicationInput.repositoryUrl.trim()) {
        nextErrors.repositoryUrl = "Repository URL is required";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!mode) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "DATABASE") {
        await createDatabaseService(project.id, {
          ...databaseInput,
          name: databaseInput.name.trim(),
          version: databaseInput.version.trim(),
        });
        await onCreated();
        showToast("Database service created");
        onClose();
        return;
      }

      if (mode === "APPLICATION") {
        await createApplicationService(project.id, {
          ...applicationInput,
          name: applicationInput.name.trim(),
          repositoryUrl: applicationInput.repositoryUrl.trim(),
          branch: applicationInput.branch?.trim() || "main",
          linkedDatabaseServiceId: applicationInput.linkedDatabaseServiceId || null,
        });
        await onCreated();
        showToast("Application service created");
        onClose();
        return;
      }

      const createdDatabase = await createDatabaseService(project.id, {
        ...databaseInput,
        name: databaseInput.name.trim(),
        version: databaseInput.version.trim(),
      });

      try {
        await createApplicationService(project.id, {
          ...applicationInput,
          name: applicationInput.name.trim(),
          repositoryUrl: applicationInput.repositoryUrl.trim(),
          branch: applicationInput.branch?.trim() || "main",
          linkedDatabaseServiceId: createdDatabase.id,
        });
        await onCreated();
        showToast("Database and application services created");
        onClose();
      } catch {
        await onCreated();
        showToast("Database was created, but application creation failed. You can create or link it manually.", "error");
        return;
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create service", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="app-modal w-full max-w-3xl rounded-[1.5rem] sm:rounded-[1.75rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
          <div className="min-w-0">
            <p className="app-muted text-sm font-semibold">Step {step} of 3</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Add Service</h2>
          </div>
          <button type="button" onClick={onClose} className="app-button-ghost !px-3 !py-3">
            <X size={18} />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { key: "DATABASE", title: "Database only", description: "Provision a managed database instance", icon: Database },
                { key: "APPLICATION", title: "Application only", description: "Deploy from a GitHub repository", icon: AppWindow },
                { key: "BOTH", title: "Both", description: "Create a database and application together", icon: Layers },
              ].map(({ key, title, description, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key as ServiceCreationMode)}
                  className={`app-card text-left transition-all ${
                    mode === key ? "border-indigo-500 bg-indigo-500/10" : ""
                  }`}
                >
                  <div className="mb-4 inline-flex rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-indigo-500">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="app-muted mt-2 text-sm">{description}</p>
                </button>
              ))}
            </div>

            <div className="app-mobile-actions justify-end">
              <button
                type="button"
                disabled={!mode}
                onClick={() => setStep(2)}
                className="app-button-primary"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            {(mode === "DATABASE" || mode === "BOTH") ? (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold">Database Configuration</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="app-label">Service Name</label>
                    <input
                      value={databaseInput.name}
                      onChange={(event) => setDatabaseInput((current) => ({ ...current, name: event.target.value }))}
                      className="app-input"
                      placeholder="e.g. shiply-db"
                    />
                    {errors.databaseName ? <p className="mt-2 text-sm text-rose-500">{errors.databaseName}</p> : null}
                  </div>
                  <div>
                    <label className="app-label">Database Type</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(Object.entries(databaseTypeMeta) as Array<[DatabaseType, typeof selectedDatabaseType]>).map(
                        ([type, meta]) => {
                          const Icon = meta.icon;
                          const isSelected = databaseInput.databaseType === type;

                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                const nextType = type;
                                setDatabaseInput((current) => ({
                                  ...current,
                                  databaseType: nextType,
                                  version: databaseDirty ? current.version : databaseDefaults[nextType],
                                }));
                              }}
                              className={`rounded-2xl border p-4 text-left transition-all ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-500/10 shadow-sm"
                                  : "border-[var(--app-border)] bg-[var(--app-surface-soft)] hover:border-indigo-300"
                              }`}
                              aria-pressed={isSelected}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-current/20 bg-white/70 ${meta.accentClass}`}
                                >
                                  <Icon size={18} />
                                </div>
                                <div
                                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.2em] ${meta.accentClass}`}
                                >
                                  {meta.mark}
                                </div>
                              </div>
                              <p className="mt-3 text-sm font-semibold">{meta.label}</p>
                              <p className="app-muted mt-1 text-xs">{meta.hint}</p>
                            </button>
                          );
                        },
                      )}
                    </div>
                    <select
                      value={databaseInput.databaseType}
                      onChange={(event) => {
                        const nextType = event.target.value as DatabaseType;
                        setDatabaseInput((current) => ({
                          ...current,
                          databaseType: nextType,
                          version: databaseDirty ? current.version : databaseDefaults[nextType],
                        }));
                      }}
                      className="sr-only"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <option value="POSTGRESQL">PostgreSQL</option>
                      <option value="MYSQL">MySQL</option>
                      <option value="REDIS">Redis</option>
                      <option value="MONGODB">MongoDB</option>
                    </select>
                  </div>
                  <div>
                    <label className="app-label">Version</label>
                    <input
                      value={databaseInput.version}
                      onChange={(event) => {
                        setDatabaseDirty(true);
                        setDatabaseInput((current) => ({ ...current, version: event.target.value }));
                      }}
                      className="app-input"
                    />
                    {errors.databaseVersion ? <p className="mt-2 text-sm text-rose-500">{errors.databaseVersion}</p> : null}
                  </div>
                </div>
              </section>
            ) : null}

            {(mode === "APPLICATION" || mode === "BOTH") ? (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold">Application Configuration</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="app-label">Service Name</label>
                    <input
                      value={applicationInput.name}
                      onChange={(event) => setApplicationInput((current) => ({ ...current, name: event.target.value }))}
                      className="app-input"
                      placeholder="e.g. shiply-api"
                    />
                    {errors.applicationName ? <p className="mt-2 text-sm text-rose-500">{errors.applicationName}</p> : null}
                  </div>
                  <div>
                    <label className="app-label">Repository URL</label>
                    <div className="relative">
                      <GitBranch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 app-muted" />
                      <input
                        value={applicationInput.repositoryUrl}
                        onChange={(event) => setApplicationInput((current) => ({ ...current, repositoryUrl: event.target.value }))}
                        className="app-input pl-10"
                        placeholder="https://github.com/user/repo"
                      />
                    </div>
                    {errors.repositoryUrl ? <p className="mt-2 text-sm text-rose-500">{errors.repositoryUrl}</p> : null}
                  </div>
                  <div>
                    <label className="app-label">Branch</label>
                    <input
                      value={applicationInput.branch || "main"}
                      onChange={(event) => setApplicationInput((current) => ({ ...current, branch: event.target.value }))}
                      className="app-input"
                    />
                  </div>
                  <div>
                    <label className="app-label">Database Link</label>
                    {mode === "BOTH" ? (
                      <div className="app-input flex items-center gap-2 bg-[var(--app-surface-soft)]">
                        <Link2 size={16} className="text-indigo-500" />
                        <span className="text-sm leading-5">This application will be linked to the database created in this flow.</span>
                      </div>
                    ) : (
                      <select
                        value={applicationInput.linkedDatabaseServiceId || ""}
                        onChange={(event) => setApplicationInput((current) => ({
                          ...current,
                          linkedDatabaseServiceId: event.target.value || null,
                        }))}
                        className="app-input"
                      >
                        <option value="">No database</option>
                        {databaseServices.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(1)} className="app-button-ghost">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStepTwo()) {
                    setStep(3);
                  }
                }}
                className="app-button-primary"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {(mode === "DATABASE" || mode === "BOTH") ? (
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-sm font-semibold">Database</p>
                  <p className="mt-2 text-sm">{databaseInput.name}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-current/20 bg-white/70 ${selectedDatabaseType.accentClass}`}
                    >
                      <selectedDatabaseType.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedDatabaseType.label}</p>
                      <p className="app-muted text-sm">Version {databaseInput.version}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {(mode === "APPLICATION" || mode === "BOTH") ? (
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-sm font-semibold">Application</p>
                  <p className="mt-2 text-sm">{applicationInput.name}</p>
                  <p className="app-muted mt-2 break-all text-sm">{applicationInput.repositoryUrl}</p>
                  <p className="app-muted mt-2 text-sm">Branch: {applicationInput.branch || "main"}</p>
                  <p className="app-muted mt-2 text-sm">
                    {mode === "BOTH"
                      ? "The application will be automatically linked to the new database."
                      : applicationInput.linkedDatabaseServiceId
                        ? `Linked database: ${databaseServices.find((service) => service.id === applicationInput.linkedDatabaseServiceId)?.name || "Selected database"}`
                        : "No database linked"}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(2)} className="app-button-ghost" disabled={isSubmitting}>
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="button" onClick={() => void submit()} className="app-button-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>{mode === "BOTH" ? "Create Services" : "Create Service"}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AddServiceModal;
