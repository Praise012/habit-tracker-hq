import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useExpenseContext } from "@/context/ExpenseContext";
import { format, subMonths, addMonths, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = [
  "hsl(160, 60%, 38%)", "hsl(35, 90%, 55%)", "hsl(220, 70%, 55%)",
  "hsl(280, 60%, 55%)", "hsl(190, 70%, 45%)", "hsl(0, 72%, 51%)",
  "hsl(320, 60%, 50%)", "hsl(45, 80%, 50%)", "hsl(200, 65%, 50%)",
];

export default function Analytics() {
  const { getMonthSummary, categories, getIncomeForMonth, expenses } = useExpenseContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [trendCategory, setTrendCategory] = useState("all");

  const summary = getMonthSummary(currentMonth);
  const prevSummary = getMonthSummary(subMonths(currentMonth, 1));
  const monthStr = format(currentMonth, "yyyy-MM");
  const income = getIncomeForMonth(monthStr);

  const pieData = summary.topCategories.map((c) => ({ name: c.name, value: c.amount }));

  // 12-month trend data with optional category filter
  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = subMonths(currentMonth, 11 - i);
      const s = getMonthSummary(m);
      const inc = getIncomeForMonth(format(m, "yyyy-MM"));
      const spent = trendCategory === "all"
        ? s.totalSpent
        : (s.byCategory[trendCategory] || 0);
      return {
        month: format(m, "MMM"),
        fullMonth: format(m, "yyyy-MM"),
        spent,
        income: inc?.income || 0,
      };
    });
  }, [currentMonth, trendCategory, getMonthSummary, getIncomeForMonth]);

  // Shopping item breakdown for tracking price changes
  const shoppingBreakdown = useMemo(() => {
    const shoppingExpenses = expenses.filter((e) => e.category === "shopping");
    const itemMap: Record<string, { name: string; prices: { month: string; amount: number; date: string }[] }> = {};

    shoppingExpenses.forEach((e) => {
      const key = e.name.toLowerCase().trim();
      if (!itemMap[key]) itemMap[key] = { name: e.name, prices: [] };
      itemMap[key].prices.push({
        month: format(parseISO(e.date), "MMM yyyy"),
        amount: e.amount,
        date: e.date,
      });
    });

    return Object.values(itemMap)
      .filter((item) => item.prices.length >= 1)
      .sort((a, b) => b.prices.length - a.prices.length)
      .slice(0, 15)
      .map((item) => {
        const sorted = [...item.prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const latest = sorted[sorted.length - 1].amount;
        const first = sorted[0].amount;
        const change = sorted.length > 1 ? ((latest - first) / first) * 100 : 0;
        return { ...item, prices: sorted, change, latest };
      });
  }, [expenses]);

  const categoryComparison = Object.entries(summary.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const prevAmount = prevSummary.byCategory[catId] || 0;
      return { name: cat?.name || catId, current: amount, previous: prevAmount };
    });

  const selectedCatName = trendCategory === "all" ? "All Categories" : categories.find((c) => c.id === trendCategory)?.name || trendCategory;

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

      {/* Spending Trends with Category Filter */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Spending Trends</h2>
        </div>
        <Select value={trendCategory} onValueChange={setTrendCategory}>
          <SelectTrigger className="mb-3 h-9 text-sm">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={50}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip formatter={(v: number) => [`Ksh ${v.toLocaleString()}`]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="spent" stroke="hsl(var(--primary))" strokeWidth={2.5}
              dot={{ fill: "hsl(var(--primary))", r: 3 }} name={selectedCatName} />
            {trendCategory === "all" && (
              <Line type="monotone" dataKey="income" stroke="hsl(var(--chart-2))" strokeWidth={2}
                strokeDasharray="5 5" dot={{ fill: "hsl(var(--chart-2))", r: 3 }} name="Income" />
            )}
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Income vs Expenditure Bar Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="stat-card">
        <h2 className="font-display font-semibold mb-3">Income vs Spending</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={trendData.slice(-6)}>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="stat-card">
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

      {/* Shopping Item Price Tracking */}
      {shoppingBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="stat-card">
          <h2 className="font-display font-semibold mb-3">🛍️ Shopping Price Tracker</h2>
          <p className="text-xs text-muted-foreground mb-3">Track price changes on recurring shopping items</p>
          <div className="space-y-3">
            {shoppingBreakdown.map((item) => (
              <div key={item.name} className="rounded-xl border border-border bg-card p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                  <span className="text-sm font-bold font-display ml-2">Ksh {item.latest.toLocaleString()}</span>
                </div>
                {item.prices.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {item.change > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                    ) : item.change < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5 text-primary" />
                    ) : null}
                    <span className={`text-xs font-medium ${item.change > 0 ? "text-destructive" : item.change < 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {item.change > 0 ? "+" : ""}{item.change.toFixed(1)}% since first purchase
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {item.prices.map((p, i) => (
                    <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">
                      {p.month}: Ksh {p.amount.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {pieData.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No data for this month yet.</p>
      )}
    </div>
  );
}
