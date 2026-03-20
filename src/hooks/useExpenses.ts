import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { Expense, Category, MonthlyBudget, MonthSummary, DEFAULT_CATEGORIES } from "@/types/expense";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, getDaysInMonth } from "date-fns";

export function useExpenses() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", []);
  const [categories, setCategories] = useLocalStorage<Category[]>("categories", DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useLocalStorage<MonthlyBudget[]>("budgets", []);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [...prev, { ...expense, id: crypto.randomUUID() }]);
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [setExpenses]);

  const addCategory = useCallback((category: Omit<Category, "id">) => {
    const id = category.name.toLowerCase().replace(/\s+/g, "-");
    setCategories((prev) => [...prev, { ...category, id }]);
  }, [setCategories]);

  const setBudget = useCallback((month: string, categoryBudgets: Record<string, number>, total: number) => {
    setBudgets((prev) => {
      const filtered = prev.filter((b) => b.month !== month);
      return [...filtered, { month, categories: categoryBudgets, totalBudget: total }];
    });
  }, [setBudgets]);

  const getMonthExpenses = useCallback((month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return expenses.filter((e) => isWithinInterval(parseISO(e.date), { start, end }));
  }, [expenses]);

  const getMonthSummary = useCallback((month: Date): MonthSummary => {
    const monthExpenses = getMonthExpenses(month);
    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<string, number> = {};

    monthExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          name: cat?.name || catId,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        };
      });

    return {
      month: format(month, "yyyy-MM"),
      totalSpent,
      byCategory,
      expenseCount: monthExpenses.length,
      topCategories,
      dailyAverage: totalSpent / getDaysInMonth(month),
    };
  }, [getMonthExpenses, categories]);

  const getBudgetForMonth = useCallback((month: string) => {
    return budgets.find((b) => b.month === month);
  }, [budgets]);

  const exportCSV = useCallback(() => {
    const headers = "Name,Amount,Category,Date,Notes,Tags\n";
    const rows = expenses.map((e) => {
      const cat = categories.find((c) => c.id === e.category);
      return `"${e.name}",${e.amount},"${cat?.name || e.category}","${e.date}","${e.notes || ""}","${(e.tags || []).join(";")}"`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [expenses, categories]);

  const currentMonthSummary = useMemo(() => getMonthSummary(new Date()), [getMonthSummary]);

  return {
    expenses, categories, budgets,
    addExpense, deleteExpense, addCategory,
    setBudget, getBudgetForMonth,
    getMonthExpenses, getMonthSummary,
    currentMonthSummary, exportCSV,
  };
}
