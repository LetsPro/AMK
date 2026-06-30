export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RoleName =
  | "Super Admin"
  | "Sales Manager"
  | "Sales Executive"
  | "Accountant"
  | "Project Manager"
  | "Staff"
  | "Support Executive";

export type ClientStatus = "Active" | "On Hold" | "Completed" | "Inactive";
export type StageStatus = "Not Started" | "In Progress" | "Awaiting Client Approval" | "Revision Required" | "Completed" | "Skipped";
export type ProjectStatus = "Active" | "On Hold" | "Completed" | "Cancelled";

export type TableRow<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

type Base = { id: string; created_at: string; updated_at?: string | null };

type T<R extends Record<string, unknown>> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: T<Base & { full_name: string; email: string; phone: string | null; role_id: string | null; avatar_url: string | null; is_active: boolean }>;
      roles: T<Base & { name: RoleName; description: string | null }>;
      permissions: T<Base & { role_id: string; module: string; can_create: boolean; can_read: boolean; can_update: boolean; can_delete: boolean }>;
      website_pages: T<Base & { slug: string; title: string; content: string; meta_title: string | null; meta_description: string | null; status: "draft" | "published" }>;
      banners: T<Base & { title: string; subtitle: string | null; image_url: string | null; cta_label: string | null; cta_url: string | null; is_active: boolean }>;
      services: T<Base & { name: string; slug: string; description: string; image_url: string | null; price_from: number | null; status: "draft" | "published" }>;
      customers: T<Base & { name: string; company: string | null; email: string | null; mobile: string | null; address: string | null; notes: string | null }>;
      clients: T<Base & { customer_id: string | null; name: string; contact_person: string | null; email: string | null; mobile: string | null; address: string | null; contract_value: number | null; notes: string | null; auth_user_id: string | null; status: ClientStatus; avatar_url: string | null; admin_notes: string | null; created_by: string | null; updated_by: string | null }>;
      client_projects: T<Base & { client_id: string; name: string; description: string | null; start_date: string | null; expected_completion_date: string | null; current_stage_id: string | null; progress: number; status: ProjectStatus; created_by: string | null; updated_by: string | null }>;
      portfolio_categories: T<Base & { name: string; slug: string; description: string | null; display_order: number }>;
      portfolio_projects: T<Base & { title: string; slug: string; short_description: string | null; detailed_description: string | null; client_name: string | null; category_id: string | null; services_provided: string[] | null; technologies_used: string[] | null; location: string | null; completion_date: string | null; cover_image_url: string | null; website_url: string | null; case_study_url: string | null; status: "draft" | "published"; is_featured: boolean; display_order: number; seo_title: string | null; seo_description: string | null; seo_keywords: string | null; created_by: string | null; updated_by: string | null }>;
      portfolio_gallery: T<Base & { portfolio_project_id: string; image_url: string; caption: string | null; display_order: number }>;
      folders: T<Base & { name: string; parent_id: string | null; path: string; created_by: string | null; updated_by: string | null }>;
      files: T<Base & { folder_id: string | null; original_name: string; display_name: string; storage_path: string; public_url: string; mime_type: string | null; size: number | null; bucket: string; deleted_at: string | null; created_by: string | null; updated_by: string | null }>;
      stages: T<Base & { name: string; description: string | null; default_progress: number; display_order: number; status: "active" | "inactive"; icon: string | null; color: string | null; default_duration_days: number | null; created_by: string | null; updated_by: string | null }>;
      client_project_stages: T<Base & { client_project_id: string; stage_id: string; status: StageStatus; progress: number; start_date: string | null; expected_completion_date: string | null; completed_date: string | null; client_notes: string | null; admin_notes: string | null; display_order: number; created_by: string | null; updated_by: string | null }>;
      client_file_assignments: T<Base & { file_id: string; client_id: string; client_project_id: string | null; stage_id: string | null; client_title: string; client_description: string | null; category: string | null; display_order: number; can_preview: boolean; can_download: boolean; visible_from: string | null; expires_at: string | null; created_by: string | null; updated_by: string | null }>;
      blueprint_links: T<Base & { title: string; url: string; description: string | null; is_active: boolean; created_by: string | null; updated_by: string | null }>;
      client_blueprint_assignments: T<Base & { blueprint_id: string; client_id: string; client_project_id: string | null; stage_id: string | null; display_order: number; is_visible: boolean; created_by: string | null; updated_by: string | null }>;
      enquiries: T<Base & { name: string; email: string | null; mobile: string | null; subject: string | null; message: string; source: string; lead_id: string | null }>;
      notifications: T<Base & { user_id: string | null; title: string; message: string; module: string; entity_id: string | null; is_read: boolean }>;
      activity_logs: T<Base & { user_id: string | null; module: string; action: string; entity_id: string | null; metadata: Json }>;
      media_assets: T<Base & { bucket: string; path: string; url: string; file_name: string; mime_type: string | null; size: number | null; alt_text: string | null; created_by: string | null }>;
      app_settings: T<Base & { key: string; value: Json }>;
      gallery: T<Base & { title: string; image_url: string; category: string | null; project_id: string | null; is_featured: boolean }>;
      testimonials: T<Base & { name: string; company: string | null; quote: string; rating: number; avatar_url: string | null; is_published: boolean }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
