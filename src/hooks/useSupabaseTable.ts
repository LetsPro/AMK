import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRow, deleteRow, listRows, TableName, updateRow } from "@/services/crud";
import type { TableInsert, TableUpdate } from "@/types/database";
import { useToast } from "@/contexts/ToastContext";

export function useTable<T extends TableName>(table: T, options?: Parameters<typeof listRows<T>>[1]) {
  return useQuery({
    queryKey: [table, options],
    queryFn: () => listRows(table, options)
  });
}

export function useTableMutations<T extends TableName>(table: T, options?: { toast?: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [table] });
    if (table === "leads") queryClient.invalidateQueries({ queryKey: ["customers"] });
  };
  const label = String(table).replace(/_/g, " ");
  const message = (error: unknown) => error instanceof Error ? error.message : "Operation failed";
  const notify = options?.toast !== false;
  return {
    create: useMutation({ mutationFn: (payload: TableInsert<T>) => createRow(table, payload), onSuccess: () => { invalidate(); if (notify) toast.success("Saved", `${label} record created.`); }, onError: (error) => { if (notify) toast.error("Save failed", message(error)); } }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: TableUpdate<T> }) => updateRow(table, id, payload), onSuccess: () => { invalidate(); if (notify) toast.success("Updated", `${label} record updated.`); }, onError: (error) => { if (notify) toast.error("Update failed", message(error)); } }),
    remove: useMutation({ mutationFn: (id: string) => deleteRow(table, id), onSuccess: () => { invalidate(); if (notify) toast.success("Deleted", `${label} record deleted.`); }, onError: (error) => { if (notify) toast.error("Delete failed", message(error)); } })
  };
}
