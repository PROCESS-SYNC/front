import { useState, useCallback } from "react";

// ================================
// 타입
// ================================
export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// ================================
// useToast 훅
// ================================
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      const id = crypto.randomUUID();

      setToasts((prev) => [...prev, { id, type, message }]);

      // duration 후 자동 제거
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
    warning: (message: string) => addToast(message, "warning"),
    removeToast,
  };
};
