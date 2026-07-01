import { supabase } from "@/lib/supabase";

export type StoredFileUrlFields = {
  bucket?: string | null;
  storage_path?: string | null;
  public_url?: string | null;
  display_name?: string | null;
  original_name?: string | null;
};

export type WithPreviewUrl<T extends StoredFileUrlFields> = T & {
  preview_url: string;
  download_url: string;
};

export async function getFileAccessUrls(file: StoredFileUrlFields) {
  const fallbackUrl = file.public_url ?? "";

  if (file.bucket && file.storage_path) {
    const storage = supabase.storage.from(file.bucket);
    const fileName = file.display_name ?? file.original_name ?? undefined;
    const [preview, download] = await Promise.all([
      storage.createSignedUrl(file.storage_path, 60 * 30),
      storage.createSignedUrl(file.storage_path, 60 * 30, { download: fileName }),
    ]);

    return {
      preview_url: !preview.error && preview.data?.signedUrl ? preview.data.signedUrl : fallbackUrl,
      download_url: !download.error && download.data?.signedUrl ? download.data.signedUrl : fallbackUrl,
    };
  }

  return {
    preview_url: fallbackUrl,
    download_url: fallbackUrl,
  };
}

export async function getFileAccessUrl(file: StoredFileUrlFields) {
  return (await getFileAccessUrls(file)).preview_url;
}

export async function attachFileAccessUrls<T extends { file: StoredFileUrlFields | null }>(items: T[]) {
  return Promise.all(
    items.map(async (item) => {
      if (!item.file) return item;
      const urls = await getFileAccessUrls(item.file);
      return {
        ...item,
        file: {
          ...item.file,
          ...urls,
        },
      };
    }),
  );
}

export async function attachStoredFileAccessUrls<T extends StoredFileUrlFields>(items: T[]) {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      ...(await getFileAccessUrls(item)),
    })),
  );
}
