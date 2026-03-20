import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { Expense, Category, MonthlyBudget, MonthlyIncome, MonthSummary, ShoppingItem, DEFAULT_CATEGORIES } from "@/types/expense";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, getDaysInMonth } from "date-fns";

export function useExpenses() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", []);
  const [categories] = useLocalStorage<Category[]>("categories", DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useLocalStorage<MonthlyBudget[]>("budgets", []);
  const [incomes, setIncomes] = useLocalStorage<MonthlyIncome[]>("incomes", []);
  const [shoppingItems, setShoppingItems] = useLocalStorage<ShoppingItem[]>("shopping-items", []);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [...prev, { ...expense, id: crypto.randomUUID() }]);
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [setExpenses]);

  // Shopping list
  const addShoppingItem = useCallback((item: Omit<ShoppingItem, "id">) => {
    setShoppingItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }, [setShoppingItems]);

  const removeShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => prev.filter((i) => i.id !== id));
  }, [setShoppingItems]);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => prev.map((i) => i.id === id ? { ...i, purchased: !i.purchased } : i));
  }, [setShoppingItems]);

  const shoppingTotal = useMemo(() => {
    return shoppingItems.reduce((s, i) => s + i.price * i.quantity, 0);
  }, [shoppingItems]);

  const setMonthlyIncome = useCallback((month: string, income: number) => {
    const tithe = Math.round(income * 0.1);
    setIncomes((prev) => {
      const filtered = prev.filter((i) => i.month !== month);
      return [...filtered, { month, income, tithe }];
    });
    const titheExists = expenses.some(
      (e) => e.category === "tithe" && e.date.startsWith(month) && e.name === "Tithe (10%)"
    );
    if (!titheExists && income > 0) {
      setExpenses((prev) => {
        const cleaned = prev.filter(
          (e) => !(e.category === "tithe" && e.date.startsWith(month) && e.name === "Tithe (10%)")
        );
        return [...cleaned, {
          id: crypto.randomUUID(),
          name: "Tithe (10%)",
          amount: tithe,
          category: "tithe",
          date: new Date(month + "-01").toISOString(),
          notes: "Auto-calculated from monthly income",
        }];
      });
    }
  }, [setIncomes, setExpenses, expenses]);

  const getIncomeForMonth = useCallback((month: string) => {
    return incomes.find((i) => i.month === month);
  }, [incomes]);

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
    const headers = "Name,Amount (Ksh),Category,Date,Notes,Tags\n";
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
    expenses, categories, budgets, incomes,
    addExpense, deleteExpense,
    setMonthlyIncome, getIncomeForMonth,
    setBudget, getBudgetForMonth,
    getMonthExpenses, getMonthSummary,
    currentMonthSummary, exportCSV,
    shoppingItems, addShoppingItem, removeShoppingItem, toggleShoppingItem, shoppingTotal,
  };
}
