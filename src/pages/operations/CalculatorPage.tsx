import { useMemo, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { currency } from "@/lib/utils";
import { useTableMutations } from "@/hooks/useSupabaseTable";

type Line = { category: "Material" | "Labour" | "Service" | "Custom"; description: string; unit: string; quantity: number; rate: number };

export function CalculatorPage() {
  const [title, setTitle] = useState("Architecture Cost Estimate");
  const [tax, setTax] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [lines, setLines] = useState<Line[]>([{ category: "Material", description: "", unit: "Sq Ft", quantity: 1, rate: 0 }]);
  const calculations = useTableMutations("calculations");
  const quotations = useTableMutations("quotations");
  const subtotal = useMemo(() => lines.reduce((sum, item) => sum + Number(item.quantity) * Number(item.rate), 0), [lines]);
  const taxAmount = subtotal * tax / 100;
  const grandTotal = subtotal + taxAmount - discount;
  function update(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((item, idx) => idx === index ? { ...item, ...patch } : item));
  }
  async function save(convert: boolean) {
    const calculation = await calculations.create.mutateAsync({ title, line_items: lines, subtotal, tax: taxAmount, discount, grand_total: grandTotal });
    if (convert) {
      const quotation = await quotations.create.mutateAsync({ subtotal, tax: taxAmount, discount, grand_total: grandTotal });
      await calculations.update.mutateAsync({ id: calculation.id, payload: { quotation_id: quotation.id } });
    }
  }
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-black">Architect Cost Calculator</h1><p className="text-sm text-slate-500">Materials, labour, service charges, custom charges, tax, discount, and quotation conversion.</p></div>
      <Card className="space-y-4">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="space-y-3">{lines.map((line, index) => <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-6"><Select value={line.category} onChange={(e) => update(index, { category: e.target.value as Line["category"] })}>{["Material", "Labour", "Service", "Custom"].map((option) => <option key={option}>{option}</option>)}</Select><Input className="md:col-span-2" placeholder="Material / labour / service" value={line.description} onChange={(e) => update(index, { description: e.target.value })} /><Input placeholder="Unit" value={line.unit} onChange={(e) => update(index, { unit: e.target.value })} /><Input type="number" value={line.quantity} onChange={(e) => update(index, { quantity: Number(e.target.value) })} /><div className="flex gap-2"><Input type="number" value={line.rate} onChange={(e) => update(index, { rate: Number(e.target.value) })} /><Button type="button" variant="ghost" onClick={() => setLines((current) => current.filter((_, idx) => idx !== index))}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>
        <Button type="button" variant="secondary" onClick={() => setLines((current) => [...current, { category: "Material", description: "", unit: "Unit", quantity: 1, rate: 0 }])}><Plus className="h-4 w-4" /> Add Line</Button>
        <div className="grid gap-3 md:grid-cols-4"><label><span className="text-sm font-medium">Tax %</span><Input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></label><label><span className="text-sm font-medium">Discount</span><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></label><Card><div className="text-sm text-slate-500">Subtotal</div><div className="text-xl font-black">{currency(subtotal)}</div></Card><Card><div className="text-sm text-slate-500">Grand Total</div><div className="text-xl font-black text-brand-primary">{currency(grandTotal)}</div></Card></div>
        <div className="flex gap-2"><Button onClick={() => save(false)}>Save Estimate</Button><Button onClick={() => save(true)}><Send className="h-4 w-4" /> Convert to Quotation</Button></div>
      </Card>
    </div>
  );
}
