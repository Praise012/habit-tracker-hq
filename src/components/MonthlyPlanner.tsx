import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format, subMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

export default function MonthlyPlanner() {
  const { categories, getMonthSummary, getBudgetForMonth, setBudget, getIncomeForMonth } = useExpenseContext();
  const currentMonth = format(new Date(), "yyyy-MM");
  const summary = getMonthSummary(new Date());
  const prevSummary = getMonthSummary(subMonths(new Date(), 1));
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
        <h1 className="text-2xl font-bold font-display">Monthly Planner</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
      </motion.div>

      {/* Overview Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5" />
          <span className="text-sm opacity-80">Budget Overview</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs opacity-70">Income</p>
            <p className="text-lg font-bold font-display">Ksh {(income?.income || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Spent</p>
            <p className="text-lg font-bold font-display">Ksh {summary.totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Budget</p>
            <p className="text-lg font-bold font-display">Ksh {totalBudget.toLocaleString()}</p>
          </div>
        </div>
        {totalBudget > 0 && (
          <div className="mt-3">
            <div className="w-full h-2 rounded-full bg-primary-foreground/20">
              <div className="h-2 rounded-full bg-primary-foreground transition-all"
                style={{ width: `${Math.min((summary.totalSpent / totalBudget) * 100, 100)}%` }} />
            </div>
            <p className="text-xs mt-1 opacity-70">
              {((summary.totalSpent / totalBudget) * 100).toFixed(0)}% used
              {summary.totalSpent > totalBudget * 0.9 && " ⚠️ Nearing limit!"}
            </p>
          </div>
        )}
      </motion.div>

      {/* Suggestions */}
      {prevSummary.topCategories.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm">Smart Suggestions</h2>
          </div>
          <div className="space-y-2 text-sm">
            {prevSummary.topCategories.slice(0, 3).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-muted-foreground">
                <span>Last month: {cat.name}</span>
                <span className="font-medium text-foreground">Ksh {cat.amount.toLocaleString()}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              💡 Based on last month, consider setting your budget around Ksh {(prevSummary.totalSpent * 0.95).toLocaleString()} to save 5%.
            </p>
          </div>
        </motion.div>
      )}

      {/* Category Budgets */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="font-display font-semibold mb-3">Set Category Budgets</h2>
        <div className="space-y-3">
          {categories.map((cat) => {
            const spent = summary.byCategory[cat.id] || 0;
            const budget = parseFloat(budgetValues[cat.id]) || 0;
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
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">Ksh</span>
                    <Input type="number" min="0" placeholder="0" value={budgetValues[cat.id]}
                      onChange={(e) => setBudgetValues((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                      className="h-8 text-sm rounded-lg" />
                  </div>
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    Ksh {spent.toLocaleString()} spent
                  </span>
                </div>
                {budget > 0 && <Progress value={Math.min(pct, 100)} className="h-1.5" />}
                {overBudget && <p className="text-xs text-destructive">Over budget by Ksh {(spent - budget).toLocaleString()}!</p>}
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
