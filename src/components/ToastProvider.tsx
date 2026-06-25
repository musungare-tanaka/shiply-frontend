import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "../hooks/useToast";
import type { ToastItem } from "../hooks/useToast";

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((title: string, variant: ToastItem["variant"] = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, title, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(
    () => ({ showToast, dismissToast, toasts }),
    [dismissToast, showToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
