import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Wallet, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function BudgetTracker() {
  const { categories, getMonthSummary, getBudgetForMonth, setBudget, getIncomeForMonth } = useExpenseContext();
  const currentMonth = format(new Date(), "yyyy-MM");
  const summary = getMonthSummary(new Date());
  const existingBudget = getBudgetForMonth(currentMonth);
  const income = getIncomeForMonth(currentMonth);

  const [budgetValues, setBudgetValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    categories.forEach((cat) => {
      initial[cat.id] = existingBudget?.categories[cat.id]?.toString() || "";
    });
    return initial;
  });

  const totalBudget = Object.values(budgetValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalDiff = totalBudget - summary.totalSpent;

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
          <span className="text-sm opacity-80">Budget vs Actual</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <p className="text-xs opacity-70">Budget</p>
            <p className="text-lg font-bold font-display">Ksh {totalBudget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Spent</p>
            <p className="text-lg font-bold font-display">Ksh {summary.totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">{totalDiff >= 0 ? "Remaining" : "Over by"}</p>
            <p className={`text-lg font-bold font-display ${totalDiff < 0 ? "text-red-200" : ""}`}>
              Ksh {Math.abs(totalDiff).toLocaleString()}
            </p>
          </div>
        </div>
        {totalBudget > 0 && (
          <div>
            <div className="w-full h-2.5 rounded-full bg-primary-foreground/20">
              <div className={`h-2.5 rounded-full transition-all ${summary.totalSpent > totalBudget ? "bg-red-300" : "bg-primary-foreground"}`}
                style={{ width: `${Math.min((summary.totalSpent / totalBudget) * 100, 100)}%` }} />
            </div>
            <p className="text-xs mt-1 opacity-70">
              {((summary.totalSpent / totalBudget) * 100).toFixed(0)}% of budget used
            </p>
          </div>
        )}
      </motion.div>

      {/* Per-Category Tracking */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="font-display font-semibold mb-3">Category Breakdown</h2>
        <div className="space-y-3">
          {categories.map((cat) => {
            const spent = summary.byCategory[cat.id] || 0;
            const budget = parseFloat(budgetValues[cat.id]) || 0;
            const diff = budget - spent;
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

                {/* Budget Input */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">Budget:</span>
                    <span className="text-xs text-muted-foreground">Ksh</span>
                    <Input type="number" min="0" placeholder="0" value={budgetValues[cat.id]}
                      onChange={(e) => setBudgetValues((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                      className="h-8 text-sm rounded-lg" />
                  </div>
                </div>

                {/* Spent vs Budget comparison */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Spent: <span className="font-semibold text-foreground">Ksh {spent.toLocaleString()}</span>
                  </span>
                  {budget > 0 && (
                    <span className={`font-semibold flex items-center gap-1 ${diff >= 0 ? "text-primary" : "text-destructive"}`}>
                      {diff >= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {diff >= 0 ? `Ksh ${diff.toLocaleString()} left` : `Ksh ${Math.abs(diff).toLocaleString()} over`}
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
