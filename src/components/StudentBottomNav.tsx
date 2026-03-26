import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, CalendarDays, Heart, Trophy } from "lucide-react";

const navItems = [
  { path: "/student-dashboard", label: "Home", icon: Home },
  { path: "/student-workouts", label: "Treinos", icon: Dumbbell },
  { path: "/student-history", label: "Histórico", icon: CalendarDays },
  { path: "/student-health", label: "Saúde", icon: Heart },
  { path: "/student-challenges", label: "Desafios", icon: Trophy },
];

const StudentBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default StudentBottomNav;
