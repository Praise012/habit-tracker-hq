export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string; // ISO string
  notes?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
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
  { id: "groceries", name: "Groceries", icon: "🛒", color: "hsl(160, 60%, 38%)" },
  { id: "transport", name: "Transport", icon: "🚗", color: "hsl(220, 70%, 55%)" },
  { id: "utilities", name: "Utilities", icon: "💡", color: "hsl(35, 90%, 55%)" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "hsl(280, 60%, 55%)" },
  { id: "dining", name: "Dining Out", icon: "🍽️", color: "hsl(0, 72%, 51%)" },
  { id: "health", name: "Health", icon: "💊", color: "hsl(190, 70%, 45%)" },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "hsl(320, 60%, 50%)" },
  { id: "household", name: "Household", icon: "🏠", color: "hsl(45, 80%, 50%)" },
  { id: "education", name: "Education", icon: "📚", color: "hsl(200, 65%, 50%)" },
  { id: "other", name: "Other", icon: "📦", color: "hsl(0, 0%, 50%)" },
];
