export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RoleName =
  | "Super Admin"
  | "Sales Manager"
  | "Sales Executive"
  | "Accountant"
  | "Project Manager"
  | "Staff"
  | "Support Executive";

export type TableRow<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

type Base = {
  id: string;
  created_at: string;
  updated_at?: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Base & { full_name: string; email: string; phone: string | null; role_id: string | null; avatar_url: string | null; is_active: boolean }; Insert: Partial<Base> & { id: string; full_name: string; email: string; role_id?: string | null }; Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]> };
      roles: { Row: Base & { name: RoleName; description: string | null }; Insert: Partial<Base> & { name: RoleName; description?: string | null }; Update: Partial<Database["public"]["Tables"]["roles"]["Row"]> };
      permissions: { Row: Base & { role_id: string; module: string; can_create: boolean; can_read: boolean; can_update: boolean; can_delete: boolean }; Insert: Partial<Base> & Omit<Database["public"]["Tables"]["permissions"]["Row"], "id" | "created_at" | "updated_at">; Update: Partial<Database["public"]["Tables"]["permissions"]["Row"]> };
      website_pages: { Row: Base & { slug: string; title: string; content: string; meta_title: string | null; meta_description: string | null; status: "draft" | "published" }; Insert: Partial<Base> & { slug: string; title: string; content?: string; status?: "draft" | "published" }; Update: Partial<Database["public"]["Tables"]["website_pages"]["Row"]> };
      banners: { Row: Base & { title: string; subtitle: string | null; image_url: string | null; cta_label: string | null; cta_url: string | null; is_active: boolean }; Insert: Partial<Base> & { title: string }; Update: Partial<Database["public"]["Tables"]["banners"]["Row"]> };
      services: { Row: Base & { name: string; slug: string; description: string; image_url: string | null; price_from: number | null; status: "draft" | "published" }; Insert: Partial<Base> & { name: string; slug: string; description: string; status?: "draft" | "published" }; Update: Partial<Database["public"]["Tables"]["services"]["Row"]> };
      projects: { Row: Base & { name: string; slug: string; client_id: string | null; description: string | null; category: string | null; location: string | null; status: "Planning" | "Design" | "Approval" | "Execution" | "Completed"; budget: number | null; progress: number; start_date: string | null; end_date: string | null; cover_image_url: string | null; published: boolean }; Insert: Partial<Base> & { name: string; slug: string; status?: Database["public"]["Tables"]["projects"]["Row"]["status"] }; Update: Partial<Database["public"]["Tables"]["projects"]["Row"]> };
      gallery: { Row: Base & { title: string; image_url: string; category: string | null; project_id: string | null; is_featured: boolean }; Insert: Partial<Base> & { title: string; image_url: string }; Update: Partial<Database["public"]["Tables"]["gallery"]["Row"]> };
      testimonials: { Row: Base & { name: string; company: string | null; quote: string; rating: number; avatar_url: string | null; is_published: boolean }; Insert: Partial<Base> & { name: string; quote: string; rating?: number }; Update: Partial<Database["public"]["Tables"]["testimonials"]["Row"]> };
      enquiries: { Row: Base & { name: string; email: string | null; mobile: string | null; subject: string | null; message: string; source: string; lead_id: string | null }; Insert: Partial<Base> & { name: string; message: string; source?: string }; Update: Partial<Database["public"]["Tables"]["enquiries"]["Row"]> };
      leads: { Row: Base & { lead_code: string; name: string; company: string | null; mobile: string | null; email: string | null; address: string | null; source: string | null; service_interested: string | null; budget: number | null; notes: string | null; status: "New" | "Contacted" | "Follow Up" | "Proposal Sent" | "Converted" | "Lost"; assigned_to: string | null; customer_id: string | null }; Insert: Partial<Base> & { name: string; status?: Database["public"]["Tables"]["leads"]["Row"]["status"] }; Update: Partial<Database["public"]["Tables"]["leads"]["Row"]> };
      lead_activities: { Row: Base & { lead_id: string; activity_type: string; description: string; due_at: string | null; completed_at: string | null; created_by: string | null }; Insert: Partial<Base> & { lead_id: string; activity_type: string; description: string }; Update: Partial<Database["public"]["Tables"]["lead_activities"]["Row"]> };
      customers: { Row: Base & { name: string; company: string | null; email: string | null; mobile: string | null; address: string | null; notes: string | null }; Insert: Partial<Base> & { name: string; company?: string | null; email?: string | null; mobile?: string | null; address?: string | null; notes?: string | null }; Update: Partial<Database["public"]["Tables"]["customers"]["Row"]> };
      clients: { Row: Base & { customer_id: string | null; name: string; contact_person: string | null; email: string | null; mobile: string | null; address: string | null; contract_value: number | null; notes: string | null }; Insert: Partial<Base> & { name: string }; Update: Partial<Database["public"]["Tables"]["clients"]["Row"]> };
      client_documents: { Row: Base & { client_id: string; title: string; file_url: string; file_type: string; document_type: string }; Insert: Partial<Base> & { client_id: string; title: string; file_url: string; file_type: string; document_type: string }; Update: Partial<Database["public"]["Tables"]["client_documents"]["Row"]> };
      project_tasks: { Row: Base & { project_id: string; title: string; description: string | null; assignee_id: string | null; status: "Todo" | "In Progress" | "Review" | "Done"; priority: "Low" | "Medium" | "High" | "Critical"; due_date: string | null }; Insert: Partial<Base> & { project_id: string; title: string }; Update: Partial<Database["public"]["Tables"]["project_tasks"]["Row"]> };
      calculations: { Row: Base & { title: string; customer_id: string | null; lead_id: string | null; line_items: Json; subtotal: number; tax: number; discount: number; grand_total: number; quotation_id: string | null }; Insert: Partial<Base> & { title: string; line_items: Json; subtotal: number; tax: number; discount: number; grand_total: number }; Update: Partial<Database["public"]["Tables"]["calculations"]["Row"]> };
      quotations: { Row: Base & { quote_no: string; lead_id: string | null; customer_id: string | null; project_id: string | null; status: "Draft" | "Sent" | "Approved" | "Rejected"; subtotal: number; tax: number; discount: number; grand_total: number; valid_until: string | null; notes: string | null }; Insert: Partial<Base> & { subtotal: number; tax: number; discount: number; grand_total: number }; Update: Partial<Database["public"]["Tables"]["quotations"]["Row"]> };
      quotation_items: { Row: Base & { quotation_id: string; description: string; quantity: number; unit: string; rate: number; amount: number }; Insert: Partial<Base> & { quotation_id: string; description: string; quantity: number; unit: string; rate: number; amount: number }; Update: Partial<Database["public"]["Tables"]["quotation_items"]["Row"]> };
      invoices: { Row: Base & { invoice_no: string; quotation_id: string | null; customer_id: string | null; project_id: string | null; status: "Unpaid" | "Partial" | "Paid" | "Overdue"; subtotal: number; tax: number; discount: number; grand_total: number; paid_total: number; due_date: string | null; notes: string | null }; Insert: Partial<Base> & { subtotal: number; tax: number; discount: number; grand_total: number }; Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]> };
      invoice_items: { Row: Base & { invoice_id: string; description: string; quantity: number; unit: string; rate: number; amount: number }; Insert: Partial<Base> & { invoice_id: string; description: string; quantity: number; unit: string; rate: number; amount: number }; Update: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]> };
      payments: { Row: Base & { invoice_id: string | null; customer_id: string | null; amount: number; method: "Cash" | "UPI" | "Bank Transfer" | "Cheque"; paid_at: string; reference_no: string | null; notes: string | null }; Insert: Partial<Base> & { amount: number; method: Database["public"]["Tables"]["payments"]["Row"]["method"]; paid_at?: string }; Update: Partial<Database["public"]["Tables"]["payments"]["Row"]> };
      staff: { Row: Base & { profile_id: string | null; employee_code: string; name: string; email: string | null; mobile: string | null; department: string | null; role_id: string | null; salary: number | null; joined_at: string | null; is_active: boolean }; Insert: Partial<Base> & { name: string }; Update: Partial<Database["public"]["Tables"]["staff"]["Row"]> };
      attendance: { Row: Base & { staff_id: string; attendance_date: string; check_in: string | null; check_out: string | null; status: "Present" | "Absent" | "Half Day" | "Leave" }; Insert: Partial<Base> & { staff_id: string; attendance_date: string; status?: Database["public"]["Tables"]["attendance"]["Row"]["status"] }; Update: Partial<Database["public"]["Tables"]["attendance"]["Row"]> };
      leave_requests: { Row: Base & { staff_id: string; from_date: string; to_date: string; reason: string; status: "Pending" | "Approved" | "Rejected"; reviewed_by: string | null }; Insert: Partial<Base> & { staff_id: string; from_date: string; to_date: string; reason: string }; Update: Partial<Database["public"]["Tables"]["leave_requests"]["Row"]> };
      expenses: { Row: Base & { project_id: string | null; category: "Salary" | "Material" | "Office" | "Travel" | "Vendor" | "Utility"; vendor: string | null; amount: number; expense_date: string; receipt_url: string | null; notes: string | null }; Insert: Partial<Base> & { category: Database["public"]["Tables"]["expenses"]["Row"]["category"]; amount: number; expense_date?: string }; Update: Partial<Database["public"]["Tables"]["expenses"]["Row"]> };
      tickets: { Row: Base & { ticket_no: string; customer_id: string | null; subject: string; description: string; assigned_to: string | null; priority: "Low" | "Medium" | "High" | "Critical"; status: "Open" | "In Progress" | "Waiting" | "Resolved" | "Closed" }; Insert: Partial<Base> & { subject: string; description: string }; Update: Partial<Database["public"]["Tables"]["tickets"]["Row"]> };
      ticket_comments: { Row: Base & { ticket_id: string; author_id: string | null; comment: string; is_internal: boolean }; Insert: Partial<Base> & { ticket_id: string; comment: string }; Update: Partial<Database["public"]["Tables"]["ticket_comments"]["Row"]> };
      notifications: { Row: Base & { user_id: string | null; title: string; message: string; module: string; entity_id: string | null; is_read: boolean }; Insert: Partial<Base> & { title: string; message: string; module: string }; Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]> };
      activity_logs: { Row: Base & { user_id: string | null; module: string; action: string; entity_id: string | null; metadata: Json }; Insert: Partial<Base> & { module: string; action: string; metadata?: Json }; Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]> };
      media_assets: { Row: Base & { bucket: string; path: string; url: string; file_name: string; mime_type: string | null; size: number | null; alt_text: string | null; created_by: string | null }; Insert: Partial<Base> & { bucket: string; path: string; url: string; file_name: string; mime_type?: string | null; size?: number | null; alt_text?: string | null; created_by?: string | null }; Update: Partial<Database["public"]["Tables"]["media_assets"]["Row"]> };
      app_settings: { Row: Base & { key: string; value: Json }; Insert: Partial<Base> & { key: string; value: Json }; Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
