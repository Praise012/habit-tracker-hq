import { ExpenseProvider } from "@/context/ExpenseContext";
import Dashboard from "@/components/Dashboard";
import AddExpense from "@/components/AddExpense";
import Analytics from "@/components/Analytics";
import MonthlyPlanner from "@/components/MonthlyPlanner";
import ExpenseList from "@/components/ExpenseList";
import CategoryManager from "@/components/CategoryManager";
import ShoppingList from "@/components/ShoppingList";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import { Routes, Route } from "react-router-dom";

export default function Index() {
  return (
    <ExpenseProvider>
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-2 flex justify-end">
          <ThemeToggle />
        </div>
        <main className="max-w-lg mx-auto px-4">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="add" element={<AddExpense />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="planner" element={<MonthlyPlanner />} />
            <Route path="categories" element={<CategoryManager />} />
            <Route path="shopping" element={<ShoppingList />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </ExpenseProvider>
  );
}
