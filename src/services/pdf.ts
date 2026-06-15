import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportPdf(title: string, columns: string[], rows: Array<Array<string | number>>) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  autoTable(doc, { head: [columns], body: rows, startY: 28 });
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function exportCsv(filename: string, columns: string[], rows: Array<Array<string | number>>) {
  const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
