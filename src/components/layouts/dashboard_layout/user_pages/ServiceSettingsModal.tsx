import { CalendarDays, Loader2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { deleteService } from "../../../../lib/api";
import type { Service } from "../../../../lib/types";
import { useToast } from "../../../../hooks/useToast";

interface ServiceSettingsModalProps {
  service: Service;
  onClose: () => void;
  onDeleted: () => Promise<void> | void;
}

const ServiceSettingsModal = ({ service, onClose, onDeleted }: ServiceSettingsModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteService(service.id);
      await onDeleted();
      showToast("Service deleted");
      onClose();
    } catch (error) {
      setIsDeleting(false);
      showToast(error instanceof Error ? error.message : "Failed to delete service", "error");
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
            <p className="app-muted text-sm font-semibold">Service Settings</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{service.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="app-button-ghost !px-3 !py-3">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 text-sm">
            <p><span className="font-semibold">Type:</span> {service.type}</p>
            <p className="mt-2"><span className="font-semibold">Status:</span> {service.status}</p>
            <p className="mt-2 break-all"><span className="font-semibold">Service ID:</span> {service.id}</p>
            <p className="mt-3 flex items-start gap-2">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-[var(--app-accent)]" />
              <span>Created: {new Date(service.createdAt).toLocaleString(undefined, { timeZone: "Africa/Harare" })}</span>
            </p>
            <p className="mt-2 flex items-start gap-2">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-[var(--app-accent)]" />
              <span>Updated: {new Date(service.updatedAt).toLocaleString(undefined, { timeZone: "Africa/Harare" })}</span>
            </p>
          </div>

          <div className="app-danger-panel">
            <p className="text-sm font-semibold">Danger Zone</p>
            <p className="mt-2 text-sm">
              Delete this service if you no longer want it shown in the project.
            </p>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="app-button-danger mt-4 w-full"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              <span>Delete Service</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSettingsModal;
