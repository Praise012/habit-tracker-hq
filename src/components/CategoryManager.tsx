import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

const EMOJI_OPTIONS = ["🛒", "🚗", "💡", "🎬", "🍽️", "💊", "🛍️", "🏠", "📚", "💰", "🎮", "✈️", "🐕", "👶", "🏋️", "📱"];
const COLOR_OPTIONS = [
  "hsl(160, 60%, 38%)", "hsl(220, 70%, 55%)", "hsl(35, 90%, 55%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(190, 70%, 45%)",
  "hsl(320, 60%, 50%)", "hsl(45, 80%, 50%)",
];

export default function CategoryManager() {
  const { categories, addCategory, exportCSV } = useExpenseContext();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  const handleAdd = () => {
    if (!name.trim()) { toast.error("Enter a name"); return; }
    addCategory({ name: name.trim(), icon, color });
    toast.success("Category added!");
    setName("");
    setShowAdd(false);
  };

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
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="stat-card flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: cat.color + "22" }}>
              {cat.icon}
            </div>
            <span className="font-medium text-sm">{cat.name}</span>
          </motion.div>
        ))}
      </div>

      {!showAdd ? (
        <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full h-12 rounded-xl border-dashed">
          <Plus className="w-5 h-5 mr-2" /> Add Category
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stat-card space-y-4">
          <h3 className="font-display font-semibold">New Category</h3>
          <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl" />
          
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} onClick={() => setIcon(e)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                    icon === e ? "ring-2 ring-primary bg-primary/10" : "bg-muted"
                  }`}>{e}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1 rounded-xl">Cancel</Button>
            <Button onClick={handleAdd} className="flex-1 rounded-xl">Add</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
