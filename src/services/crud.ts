import { supabase } from "@/lib/supabase";
import type { Database, TableInsert, TableRow, TableUpdate } from "@/types/database";

export type TableName = keyof Database["public"]["Tables"];
const db = supabase as never as {
  from: (table: string) => {
    select: (columns?: string) => unknown;
    insert: (payload: unknown) => { select: (columns?: string) => { single: () => Promise<{ data: unknown; error: Error | null }> } };
    update: (payload: unknown) => { eq: (column: string, value: unknown) => { select: (columns?: string) => { single: () => Promise<{ data: unknown; error: Error | null }> } } };
    delete: () => { eq: (column: string, value: unknown) => Promise<{ error: Error | null }> };
  };
};

type Query = {
  eq: (column: string, value: unknown) => Query;
  order: (column: string, options?: { ascending?: boolean }) => Query;
  limit: (count: number) => Query;
  single: () => Promise<{ data: unknown; error: Error | null }>;
  then: Promise<{ data: unknown; error: Error | null }>["then"];
};

export async function listRows<T extends TableName>(table: T, options?: { limit?: number; orderBy?: string; ascending?: boolean; eq?: Record<string, string | number | boolean> }) {
  let query = db.from(table).select("*") as Query;
  Object.entries(options?.eq ?? {}).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  if (options?.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  if (options?.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as TableRow<T>[];
}

export async function getRow<T extends TableName>(table: T, id: string) {
  const { data, error } = await (db.from(table).select("*") as Query).eq("id", id).single();
  if (error) throw error;
  return data as unknown as TableRow<T>;
}

export async function createRow<T extends TableName>(table: T, payload: TableInsert<T>) {
  const { data, error } = await db.from(table).insert(payload).select("*").single();
  if (error) throw error;
  return data as unknown as TableRow<T>;
}

export async function updateRow<T extends TableName>(table: T, id: string, payload: TableUpdate<T>) {
  const { data, error } = await db.from(table).update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data as unknown as TableRow<T>;
}

export async function deleteRow<T extends TableName>(table: T, id: string) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}
