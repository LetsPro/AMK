import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "brand" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
      tone === "neutral" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      tone === "success" && "bg-emerald-100 text-emerald-700",
      tone === "warning" && "bg-amber-100 text-amber-700",
      tone === "danger" && "bg-red-100 text-red-700",
      tone === "brand" && "bg-orange-100 text-brand-primary"
    )}>{children}</span>
  );
}
