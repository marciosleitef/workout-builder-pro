import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle, Dumbbell, Calendar, LogOut, Sun, Moon, Plus, Link2, Users, Package, Trophy, Bell } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";
import logoPS from "@/assets/logo-ps.png";

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
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkGroupId, setLinkGroupId] = useState("");
  const [linkPlanId, setLinkPlanId] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [planCount, setPlanCount] = useState(0);
  const [challengeCount, setChallengeCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchStudentCount();
    fetchGroupCount();
    fetchGroups();
    fetchPlanCount();
    fetchPlans();
    fetchChallengeCount();
  }, [user]);

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("id, name").eq("professor_id", user?.id).order("name");
    setPlans(data || []);
  };

  const fetchGroups = async () => {
    const { data } = await supabase.from("student_groups").select("id, name").eq("professor_id", user?.id).order("name");
    setGroups(data || []);
  };

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

  const fetchPlanCount = async () => {
    const { count } = await supabase.from("plans").select("*", { count: "exact", head: true }).eq("professor_id", user?.id);
    setPlanCount(count || 0);
  };

  const fetchChallengeCount = async () => {
    const { count } = await supabase.from("challenges" as any).select("*", { count: "exact", head: true }).eq("professor_id", user?.id);
    setChallengeCount(count || 0);
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
      route: "/students",
    },
    {
      icon: Dumbbell,
      title: "Biblioteca de Exercícios",
      description: "Veja e organize seus exercícios por pilar",
      stat: "196+ exercícios",
      route: "/exercises",
    },
    {
      icon: Calendar,
      title: "Calendário de Frequência",
      description: "Relatório de check-ins e presença dos alunos",
      stat: "Visão mensal",
      route: "/attendance",
    },
    {
      icon: Users,
      title: "Grupos de Alunos",
      description: "Gerencie seus grupos: online, presencial, corrida...",
      stat: `${groupCount} grupo(s)`,
      route: "/groups",
    },
    {
      icon: Package,
      title: "Planos",
      description: "Gerencie planos, valores e periodicidade dos alunos",
      stat: `${planCount} plano(s)`,
      route: "/plans",
    },
    {
      icon: Trophy,
      title: "Desafios",
      description: "Crie desafios com ranking e gamificação para engajar",
      stat: `${challengeCount} desafio(s)`,
      route: "/challenges",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-foreground px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoPS} alt="PS" className="h-9" />
            <div className="h-8 w-px bg-primary-foreground/15" />
            <div>
              <h1 className="text-primary-foreground font-display font-bold text-lg tracking-tight">{profileName.toUpperCase() || "PROFESSOR"}</h1>
              <p className="text-primary-foreground/40 text-xs">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/60 hover:bg-primary-foreground/15 hover:text-primary-foreground transition-colors" title={isDark ? "Tema Claro" : "Tema Escuro"}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/10 text-sm transition-colors">
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
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl font-display font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Novo Aluno
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <button
              key={card.route}
              onClick={() => navigate(card.route)}
              className="rounded-2xl border border-border bg-card p-6 text-left hover:border-foreground/20 card-elevated group"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                <card.icon className="w-6 h-6 text-foreground/70" />
              </div>
              <h3 className="font-display font-bold text-foreground text-base mb-1">{card.title}</h3>
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
            <button onClick={() => { setShowNewStudentMenu(false); navigate("/students?showForm=true"); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center"><Plus className="w-5 h-5 text-foreground/70" /></div>
              <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Cadastro Manual</p><p className="text-xs text-muted-foreground">Preencher os dados do aluno agora</p></div>
            </button>
            <button onClick={() => { setShowNewStudentMenu(false); setLinkGroupId(""); setLinkPlanId(""); setTimeout(() => setShowLinkDialog(true), 150); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center"><Link2 className="w-5 h-5 text-foreground/70" /></div>
              <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Enviar Link de Cadastro</p><p className="text-xs text-muted-foreground">O aluno preenche seus próprios dados</p></div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link with group selection */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Gerar Link de Cadastro</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {groups.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground">Grupo do aluno (opcional)</label>
                <select value={linkGroupId} onChange={(e) => setLinkGroupId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="">Sem grupo definido</option>
                  {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Se selecionado, o grupo virá travado no formulário de cadastro.</p>
              </div>
            )}
            {plans.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground">Plano do aluno (opcional)</label>
                <select value={linkPlanId} onChange={(e) => setLinkPlanId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="">Sem plano definido</option>
                  {plans.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Se selecionado, o plano virá travado no formulário de cadastro.</p>
              </div>
            )}
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (linkGroupId) params.set("group", linkGroupId);
                if (linkPlanId) params.set("plan", linkPlanId);
                const qs = params.toString();
                const link = `${window.location.origin}/register/${user?.id}${qs ? `?${qs}` : ""}`;
                navigator.clipboard.writeText(link);
                toast.success("Link de cadastro copiado!");
                setShowLinkDialog(false);
              }}
              className="w-full py-3 rounded-lg bg-foreground text-background font-display font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Copiar Link
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
