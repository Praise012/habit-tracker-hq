import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AddExpense({ onClose }: { onClose?: () => void }) {
  const { categories, addExpense } = useExpenseContext();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]?.id || "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error("Please fill in name and a valid amount");
      return;
    }
    addExpense({
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
    });
    toast.success("Expense added!");
    setName("");
    setAmount("");
    setNotes("");
    onClose?.();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Add Expense</h1>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div className="text-center py-4">
          <label className="text-sm text-muted-foreground">Amount (Ksh)</label>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-2xl font-display font-bold text-muted-foreground">Ksh</span>
            <input
              type="number"
              step="1"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="text-4xl font-display font-bold bg-transparent border-none outline-none text-center w-48 text-foreground placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        <Input placeholder="What did you spend on?" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />

        {/* Category Grid */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.filter(c => c.id !== "tithe").map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all text-center ${
                  category === cat.id ? "bg-primary/10 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" />

        <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-12 rounded-xl" />

        <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold">
          <Plus className="w-5 h-5 mr-2" /> Add Expense
        </Button>
      </form>
    </motion.div>
  );
}
