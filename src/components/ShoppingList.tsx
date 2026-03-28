import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { ShoppingItem } from "@/types/expense";
import { Plus, Trash2, Check, ShoppingCart, ArrowRight, Pencil, X, Save, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PriceChange {
  itemId: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  timestamp: string;
}

export default function ShoppingList() {
  const { shoppingItems, addShoppingItem, removeShoppingItem, toggleShoppingItem, updateShoppingItem, shoppingTotal, addExpense } = useExpenseContext();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Budget for shopping category
  const { getBudgetForMonth } = useExpenseContext();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const budget = getBudgetForMonth(currentMonth);
  const shoppingBudget = budget?.categories["shopping"] || 0;
  const unspent = shoppingBudget - shoppingTotal;

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

  const handleItemUpdate = (item: ShoppingItem, newName: string, newPrice: number, newQty: number) => {
    if (item.price !== newPrice) {
      setPriceChanges((prev) => [
        { itemId: item.id, itemName: item.name, oldPrice: item.price, newPrice, timestamp: new Date().toISOString() },
        ...prev,
      ]);
    }
    updateShoppingItem(item.id, { name: newName, price: newPrice, quantity: newQty });
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
        {shoppingBudget > 0 && (
          <div className="mt-2 pt-2 border-t border-primary-foreground/20">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Shopping Budget: Ksh {shoppingBudget.toLocaleString()}</span>
              <span className={`font-semibold ${unspent >= 0 ? "" : "text-red-200"}`}>
                {unspent >= 0 ? `Ksh ${unspent.toLocaleString()} unspent` : `Ksh ${Math.abs(unspent).toLocaleString()} over`}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-primary-foreground/20 mt-1">
              <div className={`h-1.5 rounded-full transition-all ${shoppingTotal > shoppingBudget ? "bg-red-300" : "bg-primary-foreground"}`}
                style={{ width: `${Math.min((shoppingTotal / shoppingBudget) * 100, 100)}%` }} />
            </div>
          </div>
        )}
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
              <EditableItemRow key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={removeShoppingItem} onUpdate={handleItemUpdate} />
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
              <EditableItemRow key={item.id} item={item} onToggle={toggleShoppingItem} onDelete={removeShoppingItem} onUpdate={handleItemUpdate} />
            ))}
          </div>
          <Button onClick={handleRecordAsExpense} variant="outline" className="w-full mt-3 rounded-xl h-10">
            <ArrowRight className="w-4 h-4 mr-2" /> Record Purchased as Expense
          </Button>
        </motion.div>
      )}

      {/* Price Change History */}
      {priceChanges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <History className="w-4 h-4" />
            Price Changes ({priceChanges.length})
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1">
              {priceChanges.map((ch, i) => (
                <div key={i} className="stat-card flex items-center justify-between text-xs">
                  <span className="font-medium">{ch.itemName}</span>
                  <span>
                    <span className="text-muted-foreground line-through">Ksh {ch.oldPrice.toLocaleString()}</span>
                    {" → "}
                    <span className="font-semibold text-foreground">Ksh {ch.newPrice.toLocaleString()}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {shoppingItems.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No items yet. Add your shopping list above!</p>
      )}
    </div>
  );
}

function EditableItemRow({ item, onToggle, onDelete, onUpdate }: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (item: ShoppingItem, name: string, price: number, qty: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editPrice, setEditPrice] = useState(item.price.toString());
  const [editQty, setEditQty] = useState(item.quantity.toString());

  const handleSave = () => {
    const newPrice = parseFloat(editPrice) || item.price;
    const newQty = parseInt(editQty) || item.quantity;
    onUpdate(item, editName || item.name, newPrice, newQty);
    setEditing(false);
    toast.success("Item updated");
  };

  const handleCancel = () => {
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditQty(item.quantity.toString());
    setEditing(false);
  };

  const subtotal = item.price * item.quantity;

  if (editing) {
    return (
      <div className="stat-card space-y-2">
        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm rounded-lg" placeholder="Name" />
        <div className="flex gap-2">
          <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 text-sm rounded-lg flex-1" placeholder="Price" />
          <Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="h-8 text-sm rounded-lg w-16" placeholder="Qty" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="flex-1 h-8 rounded-lg text-xs">
            <Save className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 rounded-lg text-xs">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`stat-card flex items-center gap-3 ${item.purchased ? "opacity-60" : ""}`}>
      <button onClick={() => onToggle(item.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
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
      <button onClick={() => setEditing(true)}
        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onDelete(item.id)}
        className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
