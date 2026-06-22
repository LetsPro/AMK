import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { DataTable } from "@/components/tables/DataTable";
import { useTable } from "@/hooks/useSupabaseTable";
import type { TableName } from "@/services/crud";
import { exportCsv, exportPdf } from "@/services/pdf";

const tables: TableName[] = ["leads", "customers", "projects", "quotations", "invoices", "payments", "expenses", "attendance"];

export function ReportsPage() {
  const [table, setTable] = useState<TableName>("leads");
  const { data = [] } = useTable(table, { orderBy: "created_at" });
  const columns = Object.keys(data[0] ?? { id: "", created_at: "" }).slice(0, 8);
  const rows = (data as Array<Record<string, unknown>>).map((row) => columns.map((key) => String(row[key] ?? "")));
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-black">Reporting</h1><p className="text-sm text-slate-500">Generate live reports for all operations modules and export to PDF, Excel-compatible CSV, or CSV.</p></div>
      <Card className="flex flex-wrap items-center gap-3"><Select className="max-w-xs" value={table} onChange={(e) => setTable(e.target.value as TableName)}>{tables.map((item) => <option key={item}>{item}</option>)}</Select><Button variant="secondary" onClick={() => exportCsv(`${table}.csv`, columns, rows)}><Download className="h-4 w-4" /> CSV / Excel</Button><Button variant="secondary" onClick={() => exportPdf(`${table} report`, columns, rows)}><Download className="h-4 w-4" /> PDF</Button></Card>
      <DataTable data={data as never[]} columns={columns.map((key) => ({ header: key, accessorKey: key })) as never[]} emptyTitle={`No ${table} records`} />
    </div>
  );
}
