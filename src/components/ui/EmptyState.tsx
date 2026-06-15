import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="flex min-h-60 flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-orange-100 p-4 text-brand-primary"><Inbox className="h-7 w-7" /></div>
      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
