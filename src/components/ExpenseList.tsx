import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format } from "date-fns";
import { Trash2, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ExpenseList() {
  const { expenses, categories, deleteExpense, exportCSV } = useExpenseContext();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const filtered = expenses
    .filter((e) => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCat || e.category === filterCat;
      return matchSearch && matchCat;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Expenses</h1>
        <button onClick={exportCSV} className="p-2 rounded-full hover:bg-muted transition-colors" title="Export CSV">
          <Download className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl" />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setFilterCat("")}
          className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
            !filterCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id === filterCat ? "" : cat.id)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filterCat === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No expenses found</p>
        ) : (
          filtered.map((exp, i) => {
            const cat = categories.find((c) => c.id === exp.category);
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="stat-card flex items-center gap-3"
              >
                <span className="text-xl">{cat?.icon || "📦"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{exp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat?.name} · {format(new Date(exp.date), "MMM d, yyyy")}
                  </p>
                  {exp.notes && <p className="text-xs text-muted-foreground/70 truncate">{exp.notes}</p>}
                </div>
                <p className="font-semibold text-sm mr-2">-${exp.amount.toFixed(2)}</p>
                <button onClick={() => deleteExpense(exp.id)}
                  className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
