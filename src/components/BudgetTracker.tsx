import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Wallet, AlertTriangle, CheckCircle, PiggyBank, ArrowDownToLine, History } from "lucide-react";

export default function BudgetTracker() {
  const { categories, getMonthSummary, getMonthExpenses, getBudgetForMonth, setBudget } = useExpenseContext();
  const currentMonth = format(new Date(), "yyyy-MM");
  const summary = getMonthSummary(new Date());
  const existingBudget = getBudgetForMonth(currentMonth);

  // Budget (Allocated) values - pre-filled from saved budgets
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    categories.forEach((cat) => {
      initial[cat.id] = existingBudget?.categories[cat.id]?.toString() || "";
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
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
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

  // Spent values - manual input by user
  const [spentValues, setSpentValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    categories.forEach((cat) => {
      initial[cat.id] = "";
    });
    return initial;
  });

  const totalBudget = Object.values(budgetValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalSpent = Object.values(spentValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  const handleSave = () => {
    const catBudgets: Record<string, number> = {};
    Object.entries(budgetValues).forEach(([id, val]) => {
      if (parseFloat(val) > 0) catBudgets[id] = parseFloat(val);
    });
    setBudget(currentMonth, catBudgets, totalBudget);
    toast.success("Budget saved!");
  };

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display">Budget Tracker</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
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

      {/* Per-Category Tracking */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="font-display font-semibold mb-3">Category Breakdown</h2>
        <div className="space-y-3">
          {categories.map((cat) => {
            const budget = parseFloat(budgetValues[cat.id]) || 0;
            const spent = parseFloat(spentValues[cat.id]) || 0;
            const remaining = budget - spent;
            const pct = budget > 0 ? (spent / budget) * 100 : 0;
            const overBudget = pct > 100;
            const nearBudget = pct > 80 && pct <= 100;

            return (
              <div key={cat.id} className="stat-card space-y-2">
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-medium text-sm flex-1">{cat.name}</span>
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

                {/* Spent - manual input */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">Spent:</span>
                    <span className="text-xs text-muted-foreground">Ksh</span>
                    <Input type="number" min="0" placeholder="0" value={spentValues[cat.id]}
                      onChange={(e) => setSpentValues((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                      className="h-8 text-sm rounded-lg" />
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
