import { useState } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";

const COLORS = [
  "hsl(220, 70%, 55%)", "hsl(320, 60%, 50%)", "hsl(45, 80%, 50%)",
  "hsl(35, 90%, 55%)", "hsl(200, 65%, 50%)", "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 55%)", "hsl(190, 70%, 45%)", "hsl(160, 60%, 38%)",
];

export default function Analytics() {
  const { getMonthSummary, categories, getIncomeForMonth } = useExpenseContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const summary = getMonthSummary(currentMonth);
  const prevSummary = getMonthSummary(subMonths(currentMonth, 1));
  const monthStr = format(currentMonth, "yyyy-MM");
  const income = getIncomeForMonth(monthStr);

  const pieData = summary.topCategories.map((c) => ({ name: c.name, value: c.amount }));

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(currentMonth, 5 - i);
    const s = getMonthSummary(m);
    const inc = getIncomeForMonth(format(m, "yyyy-MM"));
    return { month: format(m, "MMM"), spent: s.totalSpent, income: inc?.income || 0 };
  });

  const categoryComparison = Object.entries(summary.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const prevAmount = prevSummary.byCategory[catId] || 0;
      return { name: cat?.name || catId, current: amount, previous: prevAmount };
    });

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display">Analytics</h1>
      </motion.div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="p-2 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
        <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="p-2 rounded-full hover:bg-muted">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: `Ksh ${summary.totalSpent.toLocaleString()}` },
          { label: "Income", value: income ? `Ksh ${income.income.toLocaleString()}` : "—" },
          { label: "Daily Avg", value: `Ksh ${summary.dailyAverage.toFixed(0)}` },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="stat-card text-center">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-bold font-display">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="stat-card">
          <h2 className="font-display font-semibold mb-3">Spending Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value"
                strokeWidth={2} stroke="hsl(var(--card))">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`Ksh ${v.toLocaleString()}`, "Amount"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {summary.topCategories.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{cat.name}</span>
                <span className="ml-auto font-medium">Ksh {cat.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Income vs Expenditure Trend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="stat-card">
        <h2 className="font-display font-semibold mb-3">Income vs Spending</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyTrend}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis hide />
            <Tooltip formatter={(v: number) => [`Ksh ${v.toLocaleString()}`]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={12} name="Income" />
            <Bar dataKey="spent" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} barSize={12} name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Category Comparison */}
      {categoryComparison.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="stat-card">
          <h2 className="font-display font-semibold mb-3">vs Last Month</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryComparison} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip formatter={(v: number) => [`Ksh ${v.toLocaleString()}`]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="previous" fill="hsl(var(--muted))" radius={[4, 4, 4, 4]} barSize={10} name="Last Month" />
              <Bar dataKey="current" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={10} name="This Month" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {pieData.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No data for this month yet.</p>
      )}
    </div>
  );
}
