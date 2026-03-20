export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string; // ISO string
  notes?: string;
  tags?: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  purchased: boolean;
  date: string; // ISO string
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
}

export interface MonthlyIncome {
  month: string; // YYYY-MM
  income: number;
  tithe: number; // auto-calculated as 10%
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  categories: Record<string, number>; // categoryId -> budget amount
  totalBudget: number;
}

export interface MonthSummary {
  month: string;
  totalSpent: number;
  byCategory: Record<string, number>;
  expenseCount: number;
  topCategories: { name: string; amount: number; percentage: number }[];
  dailyAverage: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "transport", name: "Transport", icon: "🚗", color: "hsl(220, 70%, 55%)" },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "hsl(320, 60%, 50%)" },
  { id: "rent", name: "Rent", icon: "🏠", color: "hsl(45, 80%, 50%)" },
  { id: "gas", name: "Gas Refilling", icon: "⛽", color: "hsl(35, 90%, 55%)" },
  { id: "internet", name: "Internet", icon: "📶", color: "hsl(200, 65%, 50%)" },
  { id: "loans", name: "Loans", icon: "💳", color: "hsl(0, 72%, 51%)" },
  { id: "parents", name: "Parents", icon: "👨‍👩‍👦", color: "hsl(280, 60%, 55%)" },
  { id: "child-support", name: "Child Support", icon: "👶", color: "hsl(190, 70%, 45%)" },
  { id: "tithe", name: "Tithe", icon: "⛪", color: "hsl(160, 60%, 38%)" },
];
