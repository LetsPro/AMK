import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRow, deleteRow, listRows, TableName, updateRow } from "@/services/crud";
import type { TableInsert, TableUpdate } from "@/types/database";

export function useTable<T extends TableName>(table: T, options?: Parameters<typeof listRows<T>>[1]) {
  return useQuery({
    queryKey: [table, options],
    queryFn: () => listRows(table, options)
  });
}

export function useTableMutations<T extends TableName>(table: T) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [table] });
  return {
    create: useMutation({ mutationFn: (payload: TableInsert<T>) => createRow(table, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: TableUpdate<T> }) => updateRow(table, id, payload), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => deleteRow(table, id), onSuccess: invalidate })
  };
}
