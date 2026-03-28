import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Expense, Category, MonthlyBudget, MonthlyIncome, MonthSummary, ShoppingItem, DEFAULT_CATEGORIES } from "@/types/expense";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, getDaysInMonth } from "date-fns";

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [incomes, setIncomes] = useState<MonthlyIncome[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const [expRes, shopRes, budRes, incRes] = await Promise.all([
        supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("shopping_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("monthly_budgets").select("*").eq("user_id", user.id),
        supabase.from("monthly_incomes").select("*").eq("user_id", user.id),
      ]);
      if (expRes.data) setExpenses(expRes.data.map((e) => ({
        id: e.id, name: e.name, amount: Number(e.amount), category: e.category,
        date: e.date, notes: e.notes || undefined, tags: e.tags || undefined,
      })));
      if (shopRes.data) setShoppingItems(shopRes.data.map((s) => ({
        id: s.id, name: s.name, price: Number(s.price), quantity: s.quantity,
        purchased: s.purchased, date: s.date,
      })));
      if (budRes.data) setBudgets(budRes.data.map((b) => ({
        month: b.month, categories: b.categories as Record<string, number>, totalBudget: Number(b.total_budget),
      })));
      if (incRes.data) setIncomes(incRes.data.map((i) => ({
        month: i.month, income: Number(i.income), tithe: Number(i.tithe),
      })));
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    if (!user) return;
    const { data, error } = await supabase.from("expenses").insert({
      user_id: user.id, name: expense.name, amount: expense.amount,
      category: expense.category, date: expense.date,
      notes: expense.notes || null, tags: expense.tags || null,
    }).select().single();
    if (data && !error) {
      setExpenses((prev) => [{
        id: data.id, name: data.name, amount: Number(data.amount), category: data.category,
        date: data.date, notes: data.notes || undefined, tags: data.tags || undefined,
      }, ...prev]);
    }
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [user]);

  // Shopping list
  const addShoppingItem = useCallback(async (item: Omit<ShoppingItem, "id">) => {
    if (!user) return;
    const { data, error } = await supabase.from("shopping_items").insert({
      user_id: user.id, name: item.name, price: item.price,
      quantity: item.quantity, purchased: item.purchased, date: item.date,
    }).select().single();
    if (data && !error) {
      setShoppingItems((prev) => [{
        id: data.id, name: data.name, price: Number(data.price),
        quantity: data.quantity, purchased: data.purchased, date: data.date,
      }, ...prev]);
    }
  }, [user]);

  const removeShoppingItem = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("shopping_items").delete().eq("id", id);
    setShoppingItems((prev) => prev.filter((i) => i.id !== id));
  }, [user]);

  const toggleShoppingItem = useCallback(async (id: string) => {
    if (!user) return;
    const item = shoppingItems.find((i) => i.id === id);
    if (!item) return;
    await supabase.from("shopping_items").update({ purchased: !item.purchased }).eq("id", id);
    setShoppingItems((prev) => prev.map((i) => i.id === id ? { ...i, purchased: !i.purchased } : i));
  }, [user, shoppingItems]);

  const updateShoppingItem = useCallback(async (id: string, updates: Partial<Pick<ShoppingItem, "name" | "price" | "quantity">>) => {
    if (!user) return;
    await supabase.from("shopping_items").update(updates).eq("id", id);
    setShoppingItems((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
  }, [user]);

  const shoppingTotal = useMemo(() => {
    return shoppingItems.reduce((s, i) => s + i.price * i.quantity, 0);
  }, [shoppingItems]);

  const setMonthlyIncome = useCallback(async (month: string, income: number) => {
    if (!user) return;
    const tithe = Math.round(income * 0.1);
    
    // Upsert income
    await supabase.from("monthly_incomes").upsert(
      { user_id: user.id, month, income, tithe },
      { onConflict: "user_id,month" }
    );
    setIncomes((prev) => {
      const filtered = prev.filter((i) => i.month !== month);
      return [...filtered, { month, income, tithe }];
    });

    // Check for existing tithe expense
    const titheExists = expenses.some(
      (e) => e.category === "tithe" && e.date.startsWith(month) && e.name === "Tithe (10%)"
    );
    if (!titheExists && income > 0) {
      const { data } = await supabase.from("expenses").insert({
        user_id: user.id, name: "Tithe (10%)", amount: tithe,
        category: "tithe", date: new Date(month + "-01").toISOString(),
        notes: "Auto-calculated from monthly income",
      }).select().single();
      if (data) {
        setExpenses((prev) => [{
          id: data.id, name: data.name, amount: Number(data.amount), category: data.category,
          date: data.date, notes: data.notes || undefined,
        }, ...prev.filter(
          (e) => !(e.category === "tithe" && e.date.startsWith(month) && e.name === "Tithe (10%)")
        )]);
      }
    }
  }, [user, expenses]);

  const getIncomeForMonth = useCallback((month: string) => {
    return incomes.find((i) => i.month === month);
  }, [incomes]);

  const setBudget = useCallback(async (month: string, categoryBudgets: Record<string, number>, total: number) => {
    if (!user) return;
    await supabase.from("monthly_budgets").upsert(
      { user_id: user.id, month, categories: categoryBudgets, total_budget: total },
      { onConflict: "user_id,month" }
    );
    setBudgets((prev) => {
      const filtered = prev.filter((b) => b.month !== month);
      return [...filtered, { month, categories: categoryBudgets, totalBudget: total }];
    });
  }, [user]);

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
        return { name: cat?.name || catId, amount, percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 };
      });
    return {
      month: format(month, "yyyy-MM"), totalSpent, byCategory,
      expenseCount: monthExpenses.length, topCategories,
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
    expenses, categories, budgets, incomes, loading,
    addExpense, deleteExpense,
    setMonthlyIncome, getIncomeForMonth,
    setBudget, getBudgetForMonth,
    getMonthExpenses, getMonthSummary,
    currentMonthSummary, exportCSV,
    shoppingItems, addShoppingItem, removeShoppingItem, toggleShoppingItem, shoppingTotal,
  };
}
