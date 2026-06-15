import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info" | "warning";
type Toast = { id: string; title: string; description?: string; tone: ToastTone };

type ToastContextValue = {
  toast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((next: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setItems((current) => [...current, { ...next, id }].slice(-5));
    window.setTimeout(() => remove(id), 4200);
  }, [remove]);

  const value = useMemo<ToastContextValue>(() => ({
    toast,
    success: (title, description) => toast({ title, description, tone: "success" }),
    error: (title, description) => toast({ title, description, tone: "error" }),
    info: (title, description) => toast({ title, description, tone: "info" }),
    warning: (title, description) => toast({ title, description, tone: "warning" })
  }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
        <AnimatePresence>
          {items.map((item) => {
            const Icon = icons[item.tone];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={cn(
                  "flex gap-3 rounded-lg border bg-white p-4 shadow-2xl dark:bg-slate-950",
                  item.tone === "success" && "border-emerald-200",
                  item.tone === "error" && "border-red-200",
                  item.tone === "warning" && "border-amber-200",
                  item.tone === "info" && "border-blue-200"
                )}
              >
                <div className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  item.tone === "success" && "bg-emerald-100 text-emerald-700",
                  item.tone === "error" && "bg-red-100 text-red-700",
                  item.tone === "warning" && "bg-amber-100 text-amber-700",
                  item.tone === "info" && "bg-blue-100 text-blue-700"
                )}><Icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-950 dark:text-white">{item.title}</div>
                  {item.description && <div className="mt-1 text-sm text-slate-500">{item.description}</div>}
                </div>
                <button className="text-slate-400 hover:text-slate-700" onClick={() => remove(item.id)} aria-label="Close notification"><X className="h-4 w-4" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
