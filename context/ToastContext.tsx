"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

const toastStyles: Record<ToastType, { bg: string; border: string; text: string; icon: any }> = {
  success: {
    bg: "bg-pastel-mint-50",
    border: "border-pastel-mint-200",
    text: "text-pastel-mint-500",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-pastel-peach-50",
    border: "border-pastel-peach-200",
    text: "text-pastel-peach-500",
    icon: AlertCircle,
  },
  info: {
    bg: "bg-pastel-lavender-50",
    border: "border-pastel-lavender-200",
    text: "text-pastel-lavender-500",
    icon: Info,
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, message?: string, type: ToastType = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, message, type };

    setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((title: string, msg?: string) => addToast(title, msg, "success"), [addToast]);
  const error = useCallback((title: string, msg?: string) => addToast(title, msg, "error"), [addToast]);
  const info = useCallback((title: string, msg?: string) => addToast(title, msg, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const style = toastStyles[t.type];
          const Icon = style.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border ${style.border} ${style.bg} p-3.5 shadow-soft-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${style.border} bg-white ${style.text}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-800">{t.title}</p>
                {t.message && (
                  <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{t.message}</p>
                )}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

