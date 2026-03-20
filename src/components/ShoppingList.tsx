import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { ShoppingItem } from "@/types/expense";
import { Plus, Trash2, Check, ShoppingCart, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ShoppingList() {
  const { shoppingItems, addShoppingItem, removeShoppingItem, toggleShoppingItem, shoppingTotal, addExpense } = useExpenseContext();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleAdd = () => {
    if (!name.trim() || !price || parseFloat(price) <= 0) {
      toast.error("Enter item name and valid price");
      return;
    }
    addShoppingItem({
      name: name.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity) || 1,
      purchased: false,
      date: new Date().toISOString(),
    });
    setName("");
    setPrice("");
    setQuantity("1");
    toast.success("Item added to list");
  };

  const handleRecordAsExpense = () => {
    const purchasedItems = shoppingItems.filter((i) => i.purchased);
    if (purchasedItems.length === 0) {
      toast.error("Check off purchased items first");
      return;
    }
    const total = purchasedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemNames = purchasedItems.map((i) => i.name).join(", ");
    addExpense({
      name: `Shopping: ${itemNames}`,
      amount: total,
      category: "shopping",
      date: new Date().toISOString(),
      notes: `${purchasedItems.length} items`,
    });
    purchasedItems.forEach((i) => removeShoppingItem(i.id));
    toast.success(`Ksh ${total.toLocaleString()} recorded as Shopping expense`);
  };

  const pending = shoppingItems.filter((i) => !i.purchased);
  const purchased = shoppingItems.filter((i) => i.purchased);
  const purchasedTotal = purchased.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl font-bold font-display">Shopping List</h1>
        <p className="text-sm text-muted-foreground">Track individual items and record as expenses</p>
      </motion.div>

      {/* Total Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl bg-primary p-4 text-primary-foreground">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">List Total</p>
            <p className="text-2xl font-bold font-display">Ksh {shoppingTotal.toLocaleString()}</p>
          </div>
          <ShoppingCart className="w-8 h-8 opacity-60" />
        </div>
        <p className="text-xs opacity-70 mt-1">{shoppingItems.length} items · {purchased.length} purchased</p>
      </motion.div>

      {/* Add Item Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="stat-card space-y-3">
        <h2 className="font-display font-semibold text-sm">Add Item</h2>
        <Input placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl" />
        <div className="flex gap-2">
          <Input type="number" min="0" placeholder="Price (Ksh)" value={price}
            onChange={(e) => setPrice(e.target.value)} className="h-10 rounded-xl flex-1" />
          <Input type="number" min="1" placeholder="Qty" value={quantity}
            onChange={(e) => setQuantity(e.target.value)} className="h-10 rounded-xl w-20" />
        </div>
        <Button onClick={handleAdd} className="w-full rounded-xl h-10">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </motion.div>

      {/* Pending Items */}
      {pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="font-display font-semibold text-sm mb-2">To Buy ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={removeShoppingItem} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Purchased Items */}
      {purchased.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-sm">Purchased ({purchased.length})</h2>
            <span className="text-sm font-semibold text-primary">Ksh {purchasedTotal.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            {purchased.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={removeShoppingItem} />
            ))}
          </div>
          <Button onClick={handleRecordAsExpense} variant="outline" className="w-full mt-3 rounded-xl h-10">
            <ArrowRight className="w-4 h-4 mr-2" /> Record Purchased as Expense
          </Button>
        </motion.div>
      )}

      {shoppingItems.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No items yet. Add your shopping list above!</p>
      )}
    </div>
  );
}

function ItemRow({ item, onToggle, onDelete }: { item: ShoppingItem; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const subtotal = item.price * item.quantity;
  return (
    <div className={`stat-card flex items-center gap-3 ${item.purchased ? "opacity-60" : ""}`}>
      <button onClick={() => onToggle(item.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.purchased ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
        }`}>
        {item.purchased && <Check className="w-3.5 h-3.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${item.purchased ? "line-through" : ""}`}>{item.name}</p>
        <p className="text-xs text-muted-foreground">
          Ksh {item.price.toLocaleString()} × {item.quantity}
        </p>
      </div>
      <p className="font-semibold text-sm">Ksh {subtotal.toLocaleString()}</p>
      <button onClick={() => onDelete(item.id)}
        className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
