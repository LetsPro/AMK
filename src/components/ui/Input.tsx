import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950", className)} {...props} />;
}
