import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { Download } from "lucide-react";

export default function CategoryManager() {
  const { categories, exportCSV } = useExpenseContext();

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Categories</h1>
        <button onClick={exportCSV} className="p-2 rounded-full hover:bg-muted transition-colors" title="Export CSV">
          <Download className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }} className="stat-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: cat.color + "22" }}>
              {cat.icon}
            </div>
            <span className="font-medium text-sm">{cat.name}</span>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Categories are fixed for consistent tracking. Tithe is auto-calculated from your monthly income.
      </p>
    </div>
  );
}
