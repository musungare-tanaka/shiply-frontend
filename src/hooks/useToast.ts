import { createContext, useContext } from "react";

export interface ToastItem {
  id: number;
  title: string;
  variant: "success" | "error";
}

export interface ToastContextValue {
  showToast: (title: string, variant?: ToastItem["variant"]) => void;
  dismissToast: (id: number) => void;
  toasts: ToastItem[];
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
