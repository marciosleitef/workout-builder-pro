import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle, Dumbbell, Calendar, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState("");
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    fetchProfile();
    fetchStudentCount();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user?.id).single();
    if (data) setProfileName(data.full_name || user?.email || "");
  };

  const fetchStudentCount = async () => {
    const { count } = await supabase.from("students").select("*", { count: "exact", head: true });
    setStudentCount(count || 0);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const cards = [
    {
      icon: UserCircle,
      title: "Meus Alunos",
      description: "Gerencie seus alunos, crie jornadas e treinos",
      stat: `${studentCount} alunos`,
      color: "hsl(220 60% 50%)",
      bgClass: "bg-primary/10",
      route: "/students",
    },
    {
      icon: Dumbbell,
      title: "Biblioteca de Exercícios",
      description: "Veja e organize seus exercícios por pilar",
      stat: "196+ exercícios",
      color: "hsl(82 85% 55%)",
      bgClass: "bg-accent/10",
      route: "/exercises",
    },
    {
      icon: Calendar,
      title: "Calendário de Frequência",
      description: "Relatório de check-ins e presença dos alunos",
      stat: "Visão mensal",
      color: "hsl(150 55% 45%)",
      bgClass: "bg-[hsl(150,55%,45%)]/10",
      route: "/attendance",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(220,60%,45%)] to-[hsl(250,55%,50%)] px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-display font-bold text-base">
              {getInitials(profileName || "U")}
            </div>
            <div>
              <h1 className="text-white font-display font-bold text-xl">{profileName.toUpperCase() || "PROFESSOR"}</h1>
              <p className="text-white/60 text-xs">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors" title={isDark ? "Tema Claro" : "Tema Escuro"}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Cards */}
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-6">Painel Principal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <button
              key={card.route}
              onClick={() => navigate(card.route)}
              className="rounded-2xl border border-border bg-card p-6 text-left hover:border-primary/30 hover:shadow-lg transition-all group"
            >
              <div className={`w-14 h-14 rounded-xl ${card.bgClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-7 h-7" style={{ color: card.color }} />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{card.description}</p>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">{card.stat}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
