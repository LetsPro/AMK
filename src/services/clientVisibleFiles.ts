import { attachFileAccessUrls } from "@/lib/fileUrls";
import { supabase } from "@/lib/supabase";

export type ClientVisibleFile = {
  id: string;
  client_title: string;
  client_description: string | null;
  category: string | null;
  stage_id: string | null;
  can_preview: boolean;
  can_download: boolean;
  display_order: number;
  created_at: string;
  source_folder_id: string | null;
  source_folder_name: string | null;
  file: {
    id: string;
    folder_id?: string | null;
    display_name: string;
    public_url: string;
    preview_url?: string;
    download_url?: string;
    mime_type: string | null;
    size: number | null;
    storage_path: string;
    bucket: string;
  } | null;
  stage: { name: string; color: string | null } | null;
};

export async function loadClientVisibleFiles(clientId: string) {
  const now = new Date().toISOString();
  const [{ data: assignedData, error: assignedError }, { data: folderData, error: folderError }] = await Promise.all([
    supabase
      .from("client_file_assignments")
      .select("*, file:files(id,folder_id,display_name,public_url,mime_type,size,storage_path,bucket), stage:stages(name,color)")
      .eq("client_id", clientId)
      .or(`visible_from.is.null,visible_from.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gte.${now}`),
    supabase
      .from("folders")
      .select("id,name")
      .eq("client_id", clientId)
      .eq("is_client_visible", true),
  ]);

  if (assignedError) throw assignedError;
  if (folderError) throw folderError;

  const assigned = (assignedData as unknown as ClientVisibleFile[] | null) ?? [];
  const folders = (folderData as { id: string; name: string }[] | null) ?? [];
  const folderNames = new Map(folders.map((folder) => [folder.id, folder.name]));
  const assignedWithFolders = assigned.map((item) => {
    const folderId = item.file?.folder_id ?? null;
    return {
      ...item,
      source_folder_id: folderId && folderNames.has(folderId) ? folderId : null,
      source_folder_name: folderId ? folderNames.get(folderId) ?? null : null,
    };
  });
  const assignedFileIds = new Set(assigned.flatMap((item) => item.file?.id ? [item.file.id] : []));

  let folderFiles: ClientVisibleFile[] = [];
  if (folders.length) {
    const { data, error } = await supabase
      .from("files")
      .select("id,folder_id,display_name,public_url,mime_type,size,storage_path,bucket,created_at")
      .in("folder_id", folders.map((folder) => folder.id))
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;

    folderFiles = ((data as Array<{
      id: string;
      folder_id: string | null;
      display_name: string;
      public_url: string;
      mime_type: string | null;
      size: number | null;
      storage_path: string;
      bucket: string;
      created_at: string;
    }> | null) ?? [])
      .filter((file) => !assignedFileIds.has(file.id))
      .map((file, index) => ({
        id: `folder-${file.id}`,
        client_title: file.display_name,
        client_description: null,
        category: file.folder_id ? folderNames.get(file.folder_id) ?? "Client folder" : "Client folder",
        stage_id: null,
        can_preview: true,
        can_download: true,
        display_order: assigned.length + index,
        created_at: file.created_at,
        source_folder_id: file.folder_id,
        source_folder_name: file.folder_id ? folderNames.get(file.folder_id) ?? "Client folder" : "Client folder",
        file: {
          id: file.id,
          folder_id: file.folder_id,
          display_name: file.display_name,
          public_url: file.public_url,
          mime_type: file.mime_type,
          size: file.size,
          storage_path: file.storage_path,
          bucket: file.bucket,
        },
        stage: null,
      }));
  }

  const combined = [...assignedWithFolders, ...folderFiles].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return attachFileAccessUrls(combined);
}
