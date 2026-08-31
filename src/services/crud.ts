import { supabase, supabaseUrl } from "@/lib/supabase";
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

type UploadOptions = {
  onProgress?: (percentage: number) => void;
};

const RESUMABLE_UPLOAD_THRESHOLD = 6 * 1024 * 1024;

async function uploadFileResumable(bucket: string, path: string, file: File, options?: UploadOptions) {
  const { Upload } = await import("tus-js-client");
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error("Your session expired. Sign in again before uploading media.");
  if (!supabaseUrl) throw new Error("Supabase is not configured.");

  const projectId = new URL(supabaseUrl).hostname.split(".")[0];
  const endpoint = `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 1_000, 3_000, 5_000, 10_000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || "application/octet-stream",
        cacheControl: "31536000",
      },
      onError: reject,
      onProgress: (uploaded, total) => options?.onProgress?.(total ? Math.round((uploaded / total) * 100) : 0),
      onSuccess: () => resolve(),
    });

    void upload.findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
        upload.start();
      })
      .catch(reject);
  });

  options?.onProgress?.(100);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadFile(bucket: string, path: string, file: File, options?: UploadOptions) {
  if (file.size > RESUMABLE_UPLOAD_THRESHOLD) {
    return uploadFileResumable(bucket, path, file, options);
  }

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw error;
  options?.onProgress?.(100);
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}

export async function removeStoredFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
