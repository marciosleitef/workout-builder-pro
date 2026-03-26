import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle, Dumbbell, Calendar, LogOut, Sun, Moon, Plus, Link2, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [groupCount, setGroupCount] = useState(0);
  const [showNewStudentMenu, setShowNewStudentMenu] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStudentCount();
    fetchGroupCount();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user?.id).single();
    if (data) setProfileName(data.full_name || user?.email || "");
  };

  const fetchStudentCount = async () => {
    const { count } = await supabase.from("students").select("*", { count: "exact", head: true });
    setStudentCount(count || 0);
  };

  const fetchGroupCount = async () => {
    const { count } = await supabase.from("student_groups").select("*", { count: "exact", head: true }).eq("professor_id", user?.id);
    setGroupCount(count || 0);
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
    {
      icon: Users,
      title: "Grupos de Alunos",
      description: "Gerencie seus grupos: online, presencial, corrida...",
      stat: `${groupCount} grupo(s)`,
      color: "hsl(280 60% 55%)",
      bgClass: "bg-[hsl(280,60%,55%)]/10",
      route: "/groups",
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg text-foreground">Painel Principal</h2>
          <button
            onClick={() => setShowNewStudentMenu(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Aluno
          </button>
        </div>
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

      {/* New student menu */}
      <Dialog open={showNewStudentMenu} onOpenChange={setShowNewStudentMenu}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Novo Aluno</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-1">
            <button onClick={() => { setShowNewStudentMenu(false); navigate("/students?showForm=true"); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary" /></div>
              <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Cadastro Manual</p><p className="text-xs text-muted-foreground">Preencher os dados do aluno agora</p></div>
            </button>
            <button onClick={() => { const link = `${window.location.origin}/register/${user?.id}`; navigator.clipboard.writeText(link); toast.success("Link de cadastro copiado!"); setShowNewStudentMenu(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Link2 className="w-5 h-5 text-primary" /></div>
              <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Enviar Link de Cadastro</p><p className="text-xs text-muted-foreground">O aluno preenche seus próprios dados</p></div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
