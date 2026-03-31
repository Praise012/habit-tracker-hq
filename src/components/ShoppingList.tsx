import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { ShoppingItem } from "@/types/expense";
import { Plus, Trash2, Check, ShoppingCart, ArrowRight, Pencil, X, Save, History, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

interface PriceChange {
  itemId: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  timestamp: string;
}

export default function ShoppingList() {
  const {
    shoppingItems, addShoppingItem, removeShoppingItem, toggleShoppingItem,
    updateShoppingItem, shoppingTotal, addExpense, getBudgetForMonth, expenses,
    markShoppingItemsRecorded,
  } = useExpenseContext();

  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showTrends, setShowTrends] = useState(false);

  const currentMonthStr = format(selectedMonth, "yyyy-MM");
  const isCurrentMonth = format(new Date(), "yyyy-MM") === currentMonthStr;

  // Budget from Module A
  const budget = getBudgetForMonth(currentMonthStr);
  const shoppingBudget = budget?.categories["shopping"] || 0;

  // Filter shopping items by selected month
  const monthItems = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return shoppingItems.filter((item) => {
      try {
        return isWithinInterval(parseISO(item.date), { start, end });
      } catch {
        return false;
      }
    });
  }, [shoppingItems, selectedMonth]);

  const monthTotal = useMemo(() => monthItems.reduce((s, i) => s + i.price * i.quantity, 0), [monthItems]);
  const unspent = shoppingBudget - monthTotal;

  // Price trends
  const priceTrends = useMemo(() => {
    const shoppingExpenses = expenses.filter((e) => e.category === "shopping");
    const itemMap: Record<string, { month: string; amount: number }[]> = {};
    shoppingExpenses.forEach((e) => {
      const month = e.date.slice(0, 7);
      const names = e.name.replace("Shopping: ", "").split(", ");
      names.forEach((n) => {
        const key = n.trim().toLowerCase();
        if (!key) return;
        if (!itemMap[key]) itemMap[key] = [];
        itemMap[key].push({ month, amount: e.amount / names.length });
      });
    });
    shoppingItems.forEach((item) => {
      const key = item.name.trim().toLowerCase();
      const month = item.date.slice(0, 7);
      if (!itemMap[key]) itemMap[key] = [];
      itemMap[key].push({ month, amount: item.price });
    });
    return Object.entries(itemMap)
      .filter(([, entries]) => entries.length > 1)
      .map(([itemName, entries]) => {
        const sorted = entries.sort((a, b) => a.month.localeCompare(b.month));
        const first = sorted[0].amount;
        const latest = sorted[sorted.length - 1].amount;
        const change = ((latest - first) / first) * 100;
        return { name: itemName, firstPrice: first, latestPrice: latest, change, entries: sorted };
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [expenses, shoppingItems]);

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
      recorded: false,
      date: new Date().toISOString(),
    });
    setName("");
    setPrice("");
    setQuantity("1");
    toast.success("Item added to list");
  };

  const handleRecordAsExpense = () => {
    const purchasedItems = monthItems.filter((i) => i.purchased && !i.recorded);
    if (purchasedItems.length === 0) {
      toast.error("No unrecorded purchased items to sync");
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
    // Mark as recorded instead of deleting
    markShoppingItemsRecorded(purchasedItems.map((i) => i.id));
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

  const pending = monthItems.filter((i) => !i.purchased);
  const purchased = monthItems.filter((i) => i.purchased && !i.recorded);
  const recorded = monthItems.filter((i) => i.recorded);
  const purchasedTotal = purchased.reduce((s, i) => s + i.price * i.quantity, 0);
  const recordedTotal = recorded.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl font-bold font-display">Shopping List</h1>
        <p className="text-sm text-muted-foreground">Track items & sync with your budget</p>
      </motion.div>

      {/* Month Switcher */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        className="flex items-center justify-between stat-card">
        <button onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-display font-semibold text-sm">{format(selectedMonth, "MMMM yyyy")}</p>
          {!isCurrentMonth && <p className="text-[10px] text-muted-foreground">Historical view</p>}
        </div>
        <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Budget-synced Banner with Back to Budget link */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl bg-primary p-4 text-primary-foreground">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">List Total</p>
            <p className="text-2xl font-bold font-display">Ksh {monthTotal.toLocaleString()}</p>
          </div>
          <ShoppingCart className="w-8 h-8 opacity-60" />
        </div>
        <p className="text-xs opacity-70 mt-1">{monthItems.length} items · {purchased.length + recorded.length} purchased</p>

        {shoppingBudget > 0 && (
          <div className="mt-2 pt-2 border-t border-primary-foreground/20">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Budget (from Planner): Ksh {shoppingBudget.toLocaleString()}</span>
              <span className={`font-semibold ${unspent >= 0 ? "" : "text-red-200"}`}>
                {unspent >= 0 ? `Ksh ${unspent.toLocaleString()} left` : `Ksh ${Math.abs(unspent).toLocaleString()} over`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-primary-foreground/20 mt-1.5">
              <div className={`h-2 rounded-full transition-all ${monthTotal > shoppingBudget ? "bg-red-300" : "bg-primary-foreground"}`}
                style={{ width: `${Math.min((monthTotal / shoppingBudget) * 100, 100)}%` }} />
            </div>
            <p className="text-[10px] mt-1 opacity-60">
              {shoppingBudget > 0 ? `${((monthTotal / shoppingBudget) * 100).toFixed(0)}% of shopping budget used` : ""}
            </p>
          </div>
        )}
        {shoppingBudget === 0 && (
          <p className="text-[10px] mt-2 opacity-60">No shopping budget set — go to Budget Tracker to allocate</p>
        )}

        {/* Back to Budget link */}
        <button onClick={() => navigate("/planner")}
          className="flex items-center gap-1.5 mt-2 text-xs font-semibold opacity-80 hover:opacity-100 transition-opacity">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Budget
        </button>
      </motion.div>

      {/* Sync indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.07 }}
        className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
        <span>Synced with Master Budget</span>
        {recorded.length > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
            {recorded.length} recorded
          </Badge>
        )}
      </motion.div>

      {/* Add Item Form */}
      {isCurrentMonth && (
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
      )}

      {/* Pending Items */}
      {pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="font-display font-semibold text-sm mb-2">To Buy ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((item) => (
              <EditableItemRow key={item.id} item={item} onToggle={toggleShoppingItem}
                onDelete={removeShoppingItem} onUpdate={handleItemUpdate} readOnly={!isCurrentMonth} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Purchased (not yet recorded) Items */}
      {purchased.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-sm">Purchased ({purchased.length})</h2>
            <span className="text-sm font-semibold text-primary">Ksh {purchasedTotal.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            {purchased.map((item) => (
              <EditableItemRow key={item.id} item={item} onToggle={toggleShoppingItem}
                onDelete={removeShoppingItem} onUpdate={handleItemUpdate} readOnly={!isCurrentMonth} />
            ))}
          </div>
          {isCurrentMonth && (
            <Button onClick={handleRecordAsExpense} variant="outline" className="w-full mt-3 rounded-xl h-10">
              <ArrowRight className="w-4 h-4 mr-2" /> Record Purchased as Expense
            </Button>
          )}
        </motion.div>
      )}

      {/* Recorded/Archived Items - Read-only */}
      {recorded.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-sm">Recorded ({recorded.length})</h2>
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-primary">Ksh {recordedTotal.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            {recorded.map((item) => (
              <RecordedItemRow key={item.id} item={item} />
            ))}
          </div>
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

      {/* Price Trends */}
      {priceTrends.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => setShowTrends(!showTrends)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2">
            <TrendingUp className="w-4 h-4" />
            Item Price Trends ({priceTrends.length} items)
          </button>
          {showTrends && (
            <div className="space-y-2">
              {priceTrends.slice(0, 10).map((trend) => (
                <div key={trend.name} className="stat-card">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm capitalize">{trend.name}</span>
                    <div className="flex items-center gap-1.5">
                      {trend.change > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span className={`text-xs font-semibold ${trend.change > 0 ? "text-destructive" : "text-primary"}`}>
                        {trend.change > 0 ? "+" : ""}{trend.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>Ksh {trend.firstPrice.toLocaleString()}</span>
                    <span>→</span>
                    <span className="font-semibold text-foreground">Ksh {trend.latestPrice.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {monthItems.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">
          {isCurrentMonth ? "No items yet. Add your shopping list above!" : `No shopping items for ${format(selectedMonth, "MMMM yyyy")}`}
        </p>
      )}
    </div>
  );
}

/** Read-only row for recorded/archived items */
function RecordedItemRow({ item }: { item: ShoppingItem }) {
  const subtotal = item.price * item.quantity;
  return (
    <div className="stat-card flex items-center gap-3 opacity-70">
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-sm line-through">{item.name}</p>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary">
            Recorded
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Ksh {item.price.toLocaleString()} × {item.quantity}
        </p>
      </div>
      <p className="font-semibold text-sm">Ksh {subtotal.toLocaleString()}</p>
    </div>
  );
}

function EditableItemRow({ item, onToggle, onDelete, onUpdate, readOnly = false }: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (item: ShoppingItem, name: string, price: number, qty: number) => void;
  readOnly?: boolean;
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

  if (editing && !readOnly) {
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
      {!readOnly && (
        <button onClick={() => onToggle(item.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            item.purchased ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
          }`}>
          {item.purchased && <Check className="w-3.5 h-3.5" />}
        </button>
      )}
      {readOnly && item.purchased && <Check className="w-4 h-4 text-primary shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${item.purchased ? "line-through" : ""}`}>{item.name}</p>
        <p className="text-xs text-muted-foreground">
          Ksh {item.price.toLocaleString()} × {item.quantity}
        </p>
      </div>
      <p className="font-semibold text-sm">Ksh {subtotal.toLocaleString()}</p>
      {!readOnly && (
        <>
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
