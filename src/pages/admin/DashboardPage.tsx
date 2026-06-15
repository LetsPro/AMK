import { motion } from "framer-motion";
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BriefcaseBusiness, Building2, FileText, ReceiptText, Users, Wallet } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { currency } from "@/lib/utils";
import { useTable } from "@/hooks/useSupabaseTable";

export function DashboardPage() {
  const { data: leads = [] } = useTable("leads");
  const { data: projects = [] } = useTable("projects");
  const { data: quotations = [] } = useTable("quotations");
  const { data: invoices = [] } = useTable("invoices");
  const { data: payments = [] } = useTable("payments");
  const { data: expenses = [] } = useTable("expenses");
  const revenue = payments.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const expenseTotal = expenses.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const stats = [
    ["Total Leads", leads.length, BriefcaseBusiness],
    ["Converted Leads", leads.filter((lead) => lead.status === "Converted").length, Users],
    ["Active Projects", projects.filter((project) => project.status !== "Completed").length, Building2],
    ["Revenue", currency(revenue), Wallet],
    ["Expenses", currency(expenseTotal), ReceiptText],
    ["Pending Quotations", quotations.filter((quote) => ["Draft", "Sent"].includes(quote.status)).length, FileText],
    ["Pending Invoices", invoices.filter((invoice) => invoice.status !== "Paid").length, ReceiptText],
    ["Attendance", "Live", Users]
  ] as const;
  const leadChart = ["New", "Contacted", "Follow Up", "Proposal Sent", "Converted", "Lost"].map((status) => ({ status, count: leads.filter((lead) => lead.status === status).length }));
  const projectChart = projects.map((project) => ({ name: project.name.slice(0, 16), progress: project.progress }));
  const financeChart = [{ name: "Revenue", value: revenue }, { name: "Expenses", value: expenseTotal }];
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black">Executive Dashboard</h1><p className="text-sm text-slate-500">Live CRM, project, revenue, expense, invoice, and attendance metrics.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon], index) => <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}><Card><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div><div className="rounded-lg bg-orange-100 p-3 text-brand-primary"><Icon className="h-6 w-6" /></div></div></Card></motion.div>)}</div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardTitle>Revenue Trend</CardTitle><div className="h-80"><ResponsiveContainer><LineChart data={payments.map((p) => ({ date: new Date(p.paid_at).toLocaleDateString(), amount: p.amount }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="amount" stroke="#F86A0D" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Card>
        <Card><CardTitle>Expense Analysis</CardTitle><div className="h-80"><ResponsiveContainer><PieChart><Pie data={financeChart} dataKey="value" nameKey="name" innerRadius={60}>{financeChart.map((_, i) => <Cell key={i} fill={i ? "#EF4444" : "#10B981"} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Card>
        <Card><CardTitle>Lead Conversion</CardTitle><div className="h-80"><ResponsiveContainer><BarChart data={leadChart}><XAxis dataKey="status" hide /><YAxis /><Tooltip /><Bar dataKey="count" fill="#F86A0D" /></BarChart></ResponsiveContainer></div></Card>
        <Card className="xl:col-span-2"><CardTitle>Project Progress</CardTitle><div className="h-80"><ResponsiveContainer><BarChart data={projectChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="progress" fill="#FF9B4A" /></BarChart></ResponsiveContainer></div></Card>
      </div>
    </div>
  );
}
