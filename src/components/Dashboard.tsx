import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format, subMonths } from "date-fns";
import { TrendingUp, TrendingDown, Wallet, Receipt, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { currentMonthSummary, getMonthSummary, categories, getMonthExpenses } = useExpenseContext();
  const navigate = useNavigate();
  const prevSummary = getMonthSummary(subMonths(new Date(), 1));
  const diff = currentMonthSummary.totalSpent - prevSummary.totalSpent;
  const diffPercent = prevSummary.totalSpent > 0 ? (diff / prevSummary.totalSpent) * 100 : 0;

  const pieData = currentMonthSummary.topCategories.map((cat) => ({
    name: cat.name,
    value: cat.amount,
  }));

  const chartColors = [
    "hsl(160, 60%, 38%)", "hsl(35, 90%, 55%)", "hsl(220, 70%, 55%)",
    "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(190, 70%, 45%)",
  ];

  // Last 7 days spending
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, "yyyy-MM-dd");
    const dayExpenses = getMonthExpenses(new Date()).filter(
      (e) => e.date.startsWith(dayStr)
    );
    return {
      day: format(d, "EEE"),
      amount: dayExpenses.reduce((s, e) => s + e.amount, 0),
    };
  });

  const recentExpenses = [...getMonthExpenses(new Date())]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="text-2xl font-bold font-display">Spending Overview</h1>
      </motion.div>

      {/* Total Spent Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-80">This Month</p>
        <p className="text-3xl font-bold font-display mt-1">
          ${currentMonthSummary.totalSpent.toFixed(2)}
        </p>
        <div className="flex items-center gap-1 mt-2 text-sm opacity-90">
          {diff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(diffPercent).toFixed(1)}% vs last month</span>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="stat-card">
          <Wallet className="w-5 h-5 text-primary mb-2" />
          <p className="text-xs text-muted-foreground">Daily Avg</p>
          <p className="text-lg font-bold font-display">${currentMonthSummary.dailyAverage.toFixed(2)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="stat-card">
          <Receipt className="w-5 h-5 text-accent mb-2" />
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-lg font-bold font-display">{currentMonthSummary.expenseCount}</p>
        </motion.div>
      </div>

      {/* Spending by Category Pie */}
      {pieData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">By Category</h2>
            <button onClick={() => navigate("/analytics")} className="text-xs text-primary flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {currentMonthSummary.topCategories.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: chartColors[i] }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly Trend */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="stat-card">
        <h2 className="font-display font-semibold mb-3">This Week</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={last7Days}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Expenses */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Recent</h2>
          <button onClick={() => navigate("/expenses")} className="text-xs text-primary flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses yet. Tap + to add one!</p>
          ) : (
            recentExpenses.map((exp) => {
              const cat = categories.find((c) => c.id === exp.category);
              return (
                <div key={exp.id} className="stat-card flex items-center gap-3">
                  <span className="text-xl">{cat?.icon || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{exp.name}</p>
                    <p className="text-xs text-muted-foreground">{cat?.name} · {format(new Date(exp.date), "MMM d")}</p>
                  </div>
                  <p className="font-semibold text-sm">-${exp.amount.toFixed(2)}</p>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
