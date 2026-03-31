import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format, subMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Wallet, AlertTriangle, CheckCircle, PiggyBank, ArrowDownToLine, History, ShoppingCart, Lock, Eye, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BudgetTracker() {
  const { categories, getMonthSummary, getMonthExpenses, getBudgetForMonth, setBudget, shoppingTotal } = useExpenseContext();
  const navigate = useNavigate();
  const currentMonth = format(new Date(), "yyyy-MM");
  const existingBudget = getBudgetForMonth(currentMonth);

  // Budget (Allocated) values - pre-filled from saved budgets
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    categories.forEach((cat) => {
      initial[cat.id] = existingBudget?.categories[cat.id]?.toString() || "";
    });
    return initial;
  });

  // Spent values - manual input (except shopping which is auto-calculated)
  const [spentValues, setSpentValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    categories.forEach((cat) => {
      initial[cat.id] = "";
    });
    return initial;
  });

  const pushExpensesToBudget = () => {
    const monthExpenses = getMonthExpenses(new Date());
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const newBudgets: Record<string, string> = {};
    categories.forEach((cat) => {
      newBudgets[cat.id] = byCategory[cat.id]?.toString() || budgetValues[cat.id] || "";
    });
    setBudgetValues(newBudgets);
    toast.success("Expenses pushed to budget allocations!");
  };

  const pushPrevMonthToBudget = () => {
    const prevMonth = subMonths(new Date(), 1);
    const prevExpenses = getMonthExpenses(prevMonth);
    const byCategory: Record<string, number> = {};
    prevExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const newBudgets: Record<string, string> = {};
    categories.forEach((cat) => {
      newBudgets[cat.id] = byCategory[cat.id]?.toString() || budgetValues[cat.id] || "";
    });
    setBudgetValues(newBudgets);
    toast.success("Last month's expenses pushed to budget!");
  };

  // Shopping spent is auto-calculated from shopping list items
  const getSpentForCategory = (catId: string) => {
    if (catId === "shopping") return shoppingTotal;
    return parseFloat(spentValues[catId]) || 0;
  };

  const totalBudget = Object.values(budgetValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalSpent = useMemo(() => {
    return categories.reduce((sum, cat) => sum + getSpentForCategory(cat.id), 0);
  }, [spentValues, shoppingTotal, categories]);
  const totalRemaining = totalBudget - totalSpent;

  const handleSave = () => {
    const catBudgets: Record<string, number> = {};
    Object.entries(budgetValues).forEach(([id, val]) => {
      if (parseFloat(val) > 0) catBudgets[id] = parseFloat(val);
    });
    setBudget(currentMonth, catBudgets, totalBudget);
    toast.success("Budget saved!");
  };

  const handlePushToShoppingList = () => {
    const shoppingBudget = parseFloat(budgetValues["shopping"]) || 0;
    if (shoppingBudget <= 0) {
      toast.error("Set a Shopping budget first");
      return;
    }
    // Save budget first, then navigate to shopping
    handleSave();
    navigate("/shopping");
    toast.success(`Shopping list opened with Ksh ${shoppingBudget.toLocaleString()} budget`);
  };

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Budget Tracker</h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>Synced</span>
          </div>
        </div>
      </motion.div>

      {/* Summary Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-5 h-5" />
          <span className="text-sm opacity-80">Monthly Overview</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <p className="text-xs opacity-70">Allocated</p>
            <p className="text-lg font-bold font-display">Ksh {totalBudget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Total Spent</p>
            <p className="text-lg font-bold font-display">Ksh {totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">{totalRemaining >= 0 ? "Remaining" : "Over by"}</p>
            <p className={`text-lg font-bold font-display ${totalRemaining < 0 ? "text-red-200" : ""}`}>
              Ksh {Math.abs(totalRemaining).toLocaleString()}
            </p>
          </div>
        </div>
        {totalBudget > 0 && (
          <div>
            <div className="w-full h-2.5 rounded-full bg-primary-foreground/20">
              <div className={`h-2.5 rounded-full transition-all ${totalSpent > totalBudget ? "bg-red-300" : "bg-primary-foreground"}`}
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }} />
            </div>
            <p className="text-xs mt-1 opacity-70">
              {((totalSpent / totalBudget) * 100).toFixed(0)}% of budget used
            </p>
          </div>
        )}
      </motion.div>

      {/* Push Buttons */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="flex gap-2">
        <Button onClick={pushExpensesToBudget} variant="outline" className="flex-1 h-11 rounded-xl gap-2">
          <ArrowDownToLine className="w-4 h-4" />
          Push This Month
        </Button>
        <Button onClick={pushPrevMonthToBudget} variant="outline" className="flex-1 h-11 rounded-xl gap-2">
          <History className="w-4 h-4" />
          Push Last Month
        </Button>
      </motion.div>

      {/* Per-Category Tracking */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="font-display font-semibold mb-3">Category Breakdown</h2>
        <div className="space-y-3">
          {categories.map((cat) => {
            const budget = parseFloat(budgetValues[cat.id]) || 0;
            const spent = getSpentForCategory(cat.id);
            const remaining = budget - spent;
            const pct = budget > 0 ? (spent / budget) * 100 : 0;
            const overBudget = pct > 100;
            const nearBudget = pct > 80 && pct <= 100;
            const isShopping = cat.id === "shopping";

            return (
              <div key={cat.id} className="stat-card space-y-2">
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-medium text-sm flex-1">{cat.name}</span>
                  {isShopping && <Lock className="w-3 h-3 text-muted-foreground" />}
                  {overBudget && <AlertTriangle className="w-4 h-4 text-destructive" />}
                  {nearBudget && <AlertTriangle className="w-4 h-4 text-accent" />}
                  {budget > 0 && !overBudget && !nearBudget && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>

                {/* Budget (Allocated) - editable */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">Budget:</span>
                    <span className="text-xs text-muted-foreground">Ksh</span>
                    <Input type="number" min="0" placeholder="0" value={budgetValues[cat.id]}
                      onChange={(e) => setBudgetValues((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                      className="h-8 text-sm rounded-lg" />
                  </div>
                </div>

                {/* Spent - read-only for shopping, editable for others */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">Spent:</span>
                    <span className="text-xs text-muted-foreground">Ksh</span>
                    {isShopping ? (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-semibold text-foreground bg-muted px-3 py-1.5 rounded-lg flex-1">
                          {shoppingTotal.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">from list</span>
                      </div>
                    ) : (
                      <Input type="number" min="0" placeholder="0" value={spentValues[cat.id]}
                        onChange={(e) => setSpentValues((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                        className="h-8 text-sm rounded-lg" />
                    )}
                  </div>
                </div>

                {/* Remaining */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Allocated: <span className="font-semibold text-foreground">Ksh {budget.toLocaleString()}</span>
                  </span>
                  {budget > 0 && (
                    <span className={`font-semibold flex items-center gap-1 ${remaining >= 0 ? "text-primary" : "text-destructive"}`}>
                      <PiggyBank className="w-3 h-3" />
                      {remaining >= 0 ? `Ksh ${remaining.toLocaleString()} remaining` : `Ksh ${Math.abs(remaining).toLocaleString()} over`}
                    </span>
                  )}
                </div>

                {budget > 0 && <Progress value={Math.min(pct, 100)} className="h-1.5" />}

                {/* Buttons for shopping category */}
                {isShopping && budget > 0 && (
                  <div className="flex gap-2 mt-1">
                    <Button onClick={handlePushToShoppingList} variant="outline" size="sm"
                      className="flex-1 rounded-lg h-8 text-xs gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Open Shopping List
                    </Button>
                    <Button onClick={() => navigate("/shopping")} variant="ghost" size="sm"
                      className="rounded-lg h-8 text-xs gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      View List
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <Button onClick={handleSave} className="w-full h-12 rounded-xl text-base font-semibold">
        Save Budget
      </Button>
    </div>
  );
}
