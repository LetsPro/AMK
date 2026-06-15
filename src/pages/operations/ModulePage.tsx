import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/tables/DataTable";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";
import type { TableName } from "@/services/crud";
import type { TableRow } from "@/types/database";
import { exportCsv, exportPdf } from "@/services/pdf";

type Field = { key: string; label: string; type?: "text" | "email" | "number" | "date" | "textarea" | "select"; options?: string[] };

const configs: Record<string, { table: TableName; title: string; fields: Field[]; columns: string[] }> = {
  leads: { table: "leads", title: "Lead Management", fields: [{ key: "name", label: "Name" }, { key: "company", label: "Company" }, { key: "mobile", label: "Mobile" }, { key: "email", label: "Email", type: "email" }, { key: "address", label: "Address" }, { key: "source", label: "Source" }, { key: "service_interested", label: "Service Interested" }, { key: "budget", label: "Budget", type: "number" }, { key: "status", label: "Status", type: "select", options: ["New", "Contacted", "Follow Up", "Proposal Sent", "Converted", "Lost"] }, { key: "notes", label: "Notes", type: "textarea" }], columns: ["lead_code", "name", "mobile", "email", "status", "budget"] },
  customers: { table: "customers", title: "Customer Management", fields: [{ key: "name", label: "Name" }, { key: "company", label: "Company" }, { key: "email", label: "Email", type: "email" }, { key: "mobile", label: "Mobile" }, { key: "address", label: "Address" }, { key: "notes", label: "Notes", type: "textarea" }], columns: ["name", "company", "email", "mobile"] },
  clients: { table: "clients", title: "Client Management", fields: [{ key: "name", label: "Client Name" }, { key: "contact_person", label: "Contact Person" }, { key: "email", label: "Email", type: "email" }, { key: "mobile", label: "Mobile" }, { key: "address", label: "Address" }, { key: "contract_value", label: "Contract Value", type: "number" }, { key: "notes", label: "Notes", type: "textarea" }], columns: ["name", "contact_person", "email", "contract_value"] },
  projects: { table: "projects", title: "Project Management", fields: [{ key: "name", label: "Project Name" }, { key: "slug", label: "Slug" }, { key: "category", label: "Category" }, { key: "location", label: "Location" }, { key: "status", label: "Status", type: "select", options: ["Planning", "Design", "Approval", "Execution", "Completed"] }, { key: "budget", label: "Budget", type: "number" }, { key: "progress", label: "Progress", type: "number" }, { key: "start_date", label: "Start Date", type: "date" }, { key: "end_date", label: "Deadline", type: "date" }, { key: "description", label: "Description", type: "textarea" }], columns: ["name", "status", "location", "budget", "progress"] },
  quotations: { table: "quotations", title: "Quotation Management", fields: [{ key: "status", label: "Status", type: "select", options: ["Draft", "Sent", "Approved", "Rejected"] }, { key: "subtotal", label: "Subtotal", type: "number" }, { key: "tax", label: "Tax", type: "number" }, { key: "discount", label: "Discount", type: "number" }, { key: "grand_total", label: "Grand Total", type: "number" }, { key: "valid_until", label: "Valid Until", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }], columns: ["quote_no", "status", "subtotal", "tax", "discount", "grand_total"] },
  invoices: { table: "invoices", title: "Invoice Management", fields: [{ key: "status", label: "Status", type: "select", options: ["Unpaid", "Partial", "Paid", "Overdue"] }, { key: "subtotal", label: "Subtotal", type: "number" }, { key: "tax", label: "Tax", type: "number" }, { key: "discount", label: "Discount", type: "number" }, { key: "grand_total", label: "Grand Total", type: "number" }, { key: "paid_total", label: "Paid Total", type: "number" }, { key: "due_date", label: "Due Date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }], columns: ["invoice_no", "status", "grand_total", "paid_total", "due_date"] },
  payments: { table: "payments", title: "Payment Management", fields: [{ key: "amount", label: "Amount", type: "number" }, { key: "method", label: "Method", type: "select", options: ["Cash", "UPI", "Bank Transfer", "Cheque"] }, { key: "paid_at", label: "Paid At", type: "date" }, { key: "reference_no", label: "Reference No" }, { key: "notes", label: "Notes", type: "textarea" }], columns: ["amount", "method", "paid_at", "reference_no"] },
  staff: { table: "staff", title: "Staff Management", fields: [{ key: "name", label: "Name" }, { key: "email", label: "Email", type: "email" }, { key: "mobile", label: "Mobile" }, { key: "department", label: "Department" }, { key: "salary", label: "Salary", type: "number" }, { key: "joined_at", label: "Joined At", type: "date" }], columns: ["employee_code", "name", "department", "salary"] },
  attendance: { table: "attendance", title: "Attendance Management", fields: [{ key: "staff_id", label: "Staff ID" }, { key: "attendance_date", label: "Date", type: "date" }, { key: "check_in", label: "Check In" }, { key: "check_out", label: "Check Out" }, { key: "status", label: "Status", type: "select", options: ["Present", "Absent", "Half Day", "Leave"] }], columns: ["staff_id", "attendance_date", "check_in", "check_out", "status"] },
  expenses: { table: "expenses", title: "Expense Management", fields: [{ key: "category", label: "Category", type: "select", options: ["Salary", "Material", "Office", "Travel", "Vendor", "Utility"] }, { key: "vendor", label: "Vendor" }, { key: "amount", label: "Amount", type: "number" }, { key: "expense_date", label: "Expense Date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }], columns: ["category", "vendor", "amount", "expense_date"] },
  tickets: { table: "tickets", title: "Support Ticketing", fields: [{ key: "subject", label: "Subject" }, { key: "description", label: "Description", type: "textarea" }, { key: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Critical"] }, { key: "status", label: "Status", type: "select", options: ["Open", "In Progress", "Waiting", "Resolved", "Closed"] }], columns: ["ticket_no", "subject", "priority", "status"] },
  activity: { table: "activity_logs", title: "Activity Logs", fields: [{ key: "module", label: "Module" }, { key: "action", label: "Action" }, { key: "entity_id", label: "Entity ID" }], columns: ["module", "action", "entity_id", "created_at"] }
};

export function ModulePage({ name }: { name: keyof typeof configs }) {
  const config = configs[name];
  const { data = [], isLoading } = useTable(config.table, { orderBy: "created_at" });
  const { create, remove } = useTableMutations(config.table);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({});
  const columns = useMemo<ColumnDef<TableRow<typeof config.table>>[]>(() => [
    ...config.columns.map((key) => ({ header: key.replace(/_/g, " "), accessorKey: key, cell: ({ getValue }: { getValue: () => unknown }) => key === "status" || key === "priority" ? <Badge tone="brand">{String(getValue() ?? "")}</Badge> : String(getValue() ?? "") })),
    { header: "Actions", cell: ({ row }) => <Button variant="ghost" onClick={() => remove.mutate(row.original.id)}><Trash2 className="h-4 w-4" /></Button> }
  ], [config.columns, remove]);
  const rows = data as Array<Record<string, string | number | null>>;
  function setValue(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, ["budget", "progress", "subtotal", "tax", "discount", "grand_total", "paid_total", "amount", "salary", "contract_value"].includes(key) ? Number(value || 0) : value]));
    await create.mutateAsync(payload as never);
    setForm({});
    setOpen(false);
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">{config.title}</h1><p className="text-sm text-slate-500">CRUD, assignment, status tracking, exports, and audit logging through Supabase.</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => exportCsv(`${name}.csv`, config.columns, rows.map((row) => config.columns.map((key) => row[key] ?? "")))}><Download className="h-4 w-4" /> CSV</Button><Button variant="secondary" onClick={() => exportPdf(config.title, config.columns, rows.map((row) => config.columns.map((key) => String(row[key] ?? ""))))}><Download className="h-4 w-4" /> PDF</Button><Button onClick={() => setOpen((value) => !value)}><Plus className="h-4 w-4" /> Add</Button></div></div>
      {open && <Card><form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>{config.fields.map((field) => <label key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}><span className="mb-1 block text-sm font-medium">{field.label}</span>{field.type === "textarea" ? <Textarea value={String(form[field.key] ?? "")} onChange={(e) => setValue(field.key, e.target.value)} /> : field.type === "select" ? <Select value={String(form[field.key] ?? "")} onChange={(e) => setValue(field.key, e.target.value)}><option value="">Select</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</Select> : <Input type={field.type ?? "text"} value={String(form[field.key] ?? "")} onChange={(e) => setValue(field.key, e.target.value)} required={field.key === "name" || field.key === "subject" || field.key === "amount"} />}</label>)}<div className="md:col-span-2"><Button disabled={create.isPending}><Save className="h-4 w-4" /> Save</Button></div></form></Card>}
      {isLoading ? <Card>Loading records...</Card> : <DataTable data={data as never[]} columns={columns as never[]} emptyTitle={`No ${config.title.toLowerCase()} records`} />}
    </div>
  );
}
