import { CheckCircle2, X, XCircle } from "lucide-react";
import { useToast } from "../hooks/useToast";

const Toast = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[70] flex sm:right-4 sm:left-auto sm:bottom-4 sm:w-[min(92vw,24rem)] w-auto max-w-[24rem] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto app-card flex items-start gap-3 border"
        >
          <div
            className={`mt-0.5 rounded-full p-2 ${
              toast.variant === "success"
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-rose-500/15 text-rose-500"
            }`}
          >
            {toast.variant === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-5">{toast.title}</p>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="app-button-ghost !px-2 !py-2"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
