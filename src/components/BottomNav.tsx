import { NavLink, useLocation } from "react-router-dom";
import { Home, Plus, BarChart3, Calendar, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/add", icon: Plus, label: "Add", isMain: true },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
        {navItems.map(({ to, icon: Icon, label, isMain }) => {
          const active = location.pathname === to;
          if (isMain) {
            return (
              <NavLink key={to} to={to} className="flex items-center justify-center -mt-5">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                  <Icon className="w-6 h-6" />
                </div>
              </NavLink>
            );
          }
          return (
            <NavLink key={to} to={to} className={`nav-item ${active ? "nav-item-active" : ""}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
