import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, Plus, Play, User, TrendingUp, Dumbbell, Calendar, UserCircle, List, Link2, ArrowLeft, Package, Filter, Mail, Phone, Key, Eye, EyeOff, Copy, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NewJourneyWizard from "@/components/NewJourneyWizard";
import WorkoutInfoDialog from "@/components/WorkoutInfoDialog";
import JourneyListDialog from "@/components/JourneyListDialog";
import JourneyWorkoutsDialog from "@/components/JourneyWorkoutsDialog";
import JourneyEditDialog from "@/components/JourneyEditDialog";
import PlansDialog from "@/components/PlansDialog";
import BioimpedanceDialog from "@/components/BioimpedanceDialog";

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  plan: string | null;
  plan_id: string | null;
  payment_day: number | null;
  status: string | null;
  registration_date: string | null;
  birth_date: string | null;
  whatsapp: string | null;
  gender: string | null;
  group_id: string | null;
}

interface StudentGroup {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  periodicity: string;
}

const INITIALS_COLORS = [
  "hsl(220 60% 50%)",
  "hsl(150 55% 45%)",
  "hsl(35 85% 50%)",
  "hsl(280 55% 55%)",
  "hsl(0 65% 55%)",
  "hsl(180 55% 45%)",
];

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const Students = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showWorkoutMenu, setShowWorkoutMenu] = useState(false);
  const [showNewStudentMenu, setShowNewStudentMenu] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkGroupId, setLinkGroupId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showJourneyWizard, setShowJourneyWizard] = useState(false);
  const [showWorkoutInfo, setShowWorkoutInfo] = useState(false);
  const [activeJourneyId, setActiveJourneyId] = useState("");
  const [activeJourneyFormat, setActiveJourneyFormat] = useState("");
  const [showJourneyList, setShowJourneyList] = useState(false);
  const [showJourneyWorkouts, setShowJourneyWorkouts] = useState(false);
  const [showJourneyEdit, setShowJourneyEdit] = useState(false);
  const [activeJourney, setActiveJourney] = useState<{ id: string; name: string; objective: string; level: string; format: string; start_date: string; end_date: string; status: string | null } | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", plan: "", plan_id: "", payment_day: "", birth_date: "", whatsapp: "", gender: "", group_id: "", status: "active" });
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [showPlansDialog, setShowPlansDialog] = useState(false);
  const [showBioDialog, setShowBioDialog] = useState(false);
  const [bioStudent, setBioStudent] = useState<Student | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [showLoginInfo, setShowLoginInfo] = useState(false);

  // Journey start dialog
  const [showStartJourney, setShowStartJourney] = useState(false);
  const [startStudent, setStartStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchStudents();
    fetchGroups();
    fetchPlans();
  }, [user]);

  const fetchGroups = async () => {
    const { data } = await supabase.from("student_groups").select("*").order("name");
    setGroups((data as any[]) || []);
  };

  const fetchPlans = async () => {
    if (!user) return;
    const { data } = await supabase.from("plans").select("*").eq("professor_id", user.id).order("name");
    setPlans((data as any[]) || []);
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    const { error } = await supabase.from("student_groups").insert({ name: newGroupName.trim(), professor_id: user?.id } as any);
    if (error) toast.error("Erro ao criar grupo");
    else { toast.success("Grupo criado!"); setNewGroupName(""); fetchGroups(); }
  };

  useEffect(() => {
    if (searchParams.get("addWorkout") === "true" && students.length > 0) {
      const sId = searchParams.get("studentId");
      const jId = searchParams.get("journeyId");
      const jFormat = searchParams.get("journeyFormat");
      if (sId && jId && jFormat) {
        const student = students.find((s) => s.id === sId);
        if (student) {
          setSelectedStudent(student);
          setActiveJourneyId(jId);
          setActiveJourneyFormat(jFormat);
          setShowWorkoutInfo(true);
        }
      }
      setSearchParams({}, { replace: true });
    }
    if (searchParams.get("showForm") === "true") {
      setEditingStudent(null);
      setForm({ full_name: "", email: "", phone: "", plan: "", plan_id: "", payment_day: "", birth_date: "", whatsapp: "", gender: "", group_id: "", status: "active" });
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, students]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("students").select("*").order("full_name");
    if (error) toast.error("Erro ao carregar alunos");
    else setStudents(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Nome é obrigatório"); return; }
    const selectedPlan = plans.find(p => p.id === form.plan_id);
    const payload: any = {
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      plan: selectedPlan ? selectedPlan.name : (form.plan || null),
      plan_id: form.plan_id || null,
      payment_day: form.payment_day ? parseInt(form.payment_day) : null,
      birth_date: form.birth_date || null,
      whatsapp: form.whatsapp || null,
      gender: form.gender || null,
      group_id: form.group_id || null,
      status: form.status || "active",
    };
    if (editingStudent) {
      const { error } = await supabase.from("students").update(payload).eq("id", editingStudent.id);
      if (error) toast.error("Erro ao atualizar");
      else { toast.success("Aluno atualizado!"); fetchStudents(); }
    } else {
      payload.professor_id = user?.id;
      const { error } = await supabase.from("students").insert(payload);
      if (error) toast.error("Erro ao cadastrar");
      else { toast.success("Aluno cadastrado!"); fetchStudents(); }
    }
    setShowForm(false);
    setEditingStudent(null);
    setForm({ full_name: "", email: "", phone: "", plan: "", plan_id: "", payment_day: "", birth_date: "", whatsapp: "", gender: "", group_id: "", status: "active" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Aluno removido"); fetchStudents(); }
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setForm({
      full_name: s.full_name,
      email: s.email || "",
      phone: s.phone || "",
      plan: s.plan || "",
      plan_id: (s as any).plan_id || "",
      payment_day: (s as any).payment_day ? String((s as any).payment_day) : "",
      birth_date: s.birth_date || "",
      whatsapp: s.whatsapp || "",
      gender: s.gender || "",
      group_id: s.group_id || "",
      status: s.status || "active",
    });
    setShowForm(true);
  };

  const filtered = students
    .filter((s) => {
      const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase());
      const matchesGroup = !filterGroupId || s.group_id === filterGroupId;
      const matchesStatus = filterStatus === "all" || s.status === filterStatus;
      return matchesSearch && matchesGroup && matchesStatus;
    })
    .sort((a, b) => {
      // Active students first
      const aActive = a.status === "active" || !a.status ? 0 : 1;
      const bActive = b.status === "active" || !b.status ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return a.full_name.localeCompare(b.full_name);
    });

  const getPlanName = (s: Student) => {
    if ((s as any).plan_id) {
      const p = plans.find(pl => pl.id === (s as any).plan_id);
      if (p) return p.name;
    }
    return s.plan || "Sem plano";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top bar */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display font-bold text-lg text-foreground flex-1">Meus Alunos</h1>
          <button onClick={() => setShowPlansDialog(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
            <Package className="w-4 h-4" />
            Planos
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search + Add */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar atleta por nome..." className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <button onClick={() => setShowNewStudentMenu(true)} className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm hover:bg-primary/90 transition-colors shrink-0">
            <Plus className="w-4 h-4" />
            Novo Aluno
          </button>
        </div>

        {/* Status + Group filters */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["all", "active", "inactive"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === st ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              {st === "all" ? "Todos" : st === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>

        {groups.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setFilterGroupId("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filterGroupId ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              Todos
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setFilterGroupId(filterGroupId === g.id ? "" : g.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterGroupId === g.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Student grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <UserCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{search ? "Nenhum atleta encontrado" : "Nenhum aluno cadastrado ainda"}</p>
            {!search && (
              <button onClick={() => setShowForm(true)} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Cadastrar Primeiro Aluno
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s, i) => {
              const isInactive = s.status === "inactive";
              return (
                 <div key={s.id} className={`rounded-xl border bg-card p-5 transition-colors ${isInactive ? "border-border/50 opacity-70" : "border-border hover:border-primary/30"}`}>
                   <button
                     onClick={() => { setDetailStudent(s); setShowLoginInfo(false); setShowStudentDetail(true); }}
                     className="flex items-start gap-3 mb-4 w-full text-left hover:opacity-80 transition-opacity"
                   >
                     <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-display font-bold text-sm shrink-0" style={{ backgroundColor: isInactive ? "hsl(var(--muted-foreground))" : INITIALS_COLORS[i % INITIALS_COLORS.length] }}>
                       {getInitials(s.full_name)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="font-display font-bold text-foreground text-sm truncate">{s.full_name.toUpperCase()}</p>
                         <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isInactive ? "bg-destructive/15 text-destructive" : "bg-accent/15 text-accent"}`}>
                           {isInactive ? "INATIVO" : "ATIVO"}
                         </span>
                       </div>
                       <p className="text-xs text-muted-foreground">{getPlanName(s)}</p>
                       <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                         <Calendar className="w-3 h-3" />
                         {s.registration_date ? new Date(s.registration_date).toLocaleDateString("pt-BR") : "Sem registro"}
                       </p>
                     </div>
                   </button>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-secondary/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Saúde</p>
                      <p className="text-lg font-display font-bold text-foreground">—</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Performance</p>
                      <p className="text-lg font-display font-bold text-foreground">—</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: Play, label: "Iniciar", color: "hsl(220 60% 50%)", onClick: () => { setStartStudent(s); setSelectedStudent(s); setShowStartJourney(true); } },
                      { icon: User, label: "Bio", color: "hsl(150 55% 45%)", onClick: () => { setBioStudent(s); setShowBioDialog(true); } },
                      { icon: TrendingUp, label: "Detalhes", color: "hsl(35 85% 50%)", onClick: () => openEdit(s) },
                      { icon: Dumbbell, label: "Treinos", color: "hsl(82 85% 55%)", onClick: () => { setSelectedStudent(s); setShowWorkoutMenu(true); } },
                    ].map((a) => (
                      <button key={a.label} onClick={a.onClick} className="flex flex-col items-center gap-1 py-2 rounded-lg text-white text-[10px] font-medium hover:opacity-90 transition-opacity" style={{ backgroundColor: a.color }}>
                        <a.icon className="w-4 h-4" />
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editingStudent ? "Editar Aluno" : "Novo Aluno"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-foreground">Nome Completo *</label><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div><label className="text-sm font-medium text-foreground">E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Grupo</label>
              <select value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Selecione um grupo</option>
                {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
              <div className="flex gap-2 mt-2">
                <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Novo grupo..." className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <button type="button" onClick={handleAddGroup} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">Criar</button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Plano</label>
              <div className="flex items-center gap-2">
                <select value={form.plan_id} onChange={(e) => {
                  const pid = e.target.value;
                  const p = plans.find(pl => pl.id === pid);
                  setForm({ ...form, plan_id: pid, plan: p ? p.name : "" });
                }} className="flex-1 mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Selecione um plano</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toFixed(2)}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowPlansDialog(true)} className="mt-1 px-2 py-2.5 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80">
                  <Package className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Dia do Pagamento</label>
              <input type="number" min="1" max="31" value={form.payment_day} onChange={(e) => setForm({ ...form, payment_day: e.target.value })} placeholder="Ex: 10" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <p className="text-xs text-muted-foreground mt-1">Dia do mês para vencimento do pagamento</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div><label className="text-sm font-medium text-foreground">Data de Nascimento</label><input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div><label className="text-sm font-medium text-foreground">WhatsApp</label><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Gênero</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div><label className="text-sm font-medium text-foreground">Telefone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div className="flex gap-3 pt-2">
              {editingStudent && (
                <button onClick={() => { handleDelete(editingStudent.id); setShowForm(false); }} className="px-4 py-2.5 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">Remover</button>
              )}
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors">{editingStudent ? "Salvar" : "Cadastrar"}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workout menu */}
      <Dialog open={showWorkoutMenu} onOpenChange={setShowWorkoutMenu}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Treinos</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-3 mt-1">
              <div className="rounded-xl p-4 text-white bg-gradient-to-r from-[hsl(220,60%,50%)] to-[hsl(170,50%,45%)]">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <div>
                    <p className="font-display font-bold text-sm">Treino para: {selectedStudent.full_name.toUpperCase()}</p>
                    <p className="text-white/70 text-xs">Categoria: {getPlanName(selectedStudent)}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => { setShowWorkoutMenu(false); setShowJourneyWizard(true); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary" /></div>
                <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Novo Treino</p><p className="text-xs text-muted-foreground">Criar nova jornada ou treino</p></div>
              </button>
              <button onClick={() => { setShowWorkoutMenu(false); setShowJourneyList(true); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><List className="w-5 h-5 text-primary" /></div>
                <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Visualizar Treinos</p><p className="text-xs text-muted-foreground">Consultar jornadas e treinos</p></div>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Start Journey dialog */}
      <Dialog open={showStartJourney} onOpenChange={setShowStartJourney}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Iniciar Jornada</DialogTitle></DialogHeader>
          {startStudent && (
            <div className="space-y-3 mt-1">
              <div className="rounded-xl p-4 text-white bg-gradient-to-r from-[hsl(220,60%,50%)] to-[hsl(170,50%,45%)]">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  <div>
                    <p className="font-display font-bold text-sm">{startStudent.full_name.toUpperCase()}</p>
                    <p className="text-white/70 text-xs">Selecione uma jornada para iniciar</p>
                  </div>
                </div>
              </div>
              <button onClick={() => { setShowStartJourney(false); setShowJourneyList(true); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><List className="w-5 h-5 text-primary" /></div>
                <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Ver Jornadas</p><p className="text-xs text-muted-foreground">Escolher jornada já montada para iniciar</p></div>
              </button>
              <button onClick={() => { setShowStartJourney(false); setShowJourneyWizard(true); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary" /></div>
                <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Nova Jornada</p><p className="text-xs text-muted-foreground">Criar e iniciar uma nova jornada</p></div>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New student menu */}
      <Dialog open={showNewStudentMenu} onOpenChange={setShowNewStudentMenu}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Novo Aluno</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-1">
            <button onClick={() => { setShowNewStudentMenu(false); setEditingStudent(null); setForm({ full_name: "", email: "", phone: "", plan: "", plan_id: "", payment_day: "", birth_date: "", whatsapp: "", gender: "", group_id: "", status: "active" }); setShowForm(true); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary" /></div>
              <div className="text-left"><p className="font-display font-bold text-sm text-foreground">Cadastro Manual</p><p className="text-xs text-muted-foreground">Preencher os dados do aluno agora</p></div>
            </button>
            <button onClick={() => { setShowNewStudentMenu(false); setLinkGroupId(""); setTimeout(() => setShowLinkDialog(true), 150); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Link2 className="w-5 h-5 text-primary" /></div>
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
                <select value={linkGroupId} onChange={(e) => setLinkGroupId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Sem grupo definido</option>
                  {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Se selecionado, o grupo virá travado no formulário de cadastro.</p>
              </div>
            )}
            <button
              onClick={() => {
                let link = `${window.location.origin}/register/${user?.id}`;
                if (linkGroupId) link += `?group=${linkGroupId}`;
                navigator.clipboard.writeText(link);
                toast.success("Link de cadastro copiado!");
                setShowLinkDialog(false);
              }}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              Copiar Link
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plans dialog */}
      <PlansDialog open={showPlansDialog} onOpenChange={setShowPlansDialog} onPlansChanged={fetchPlans} />

      {/* Bio dialog */}
      {bioStudent && (
        <BioimpedanceDialog open={showBioDialog} onOpenChange={setShowBioDialog} studentId={bioStudent.id} studentName={bioStudent.full_name} />
      )}

      {/* Journey dialogs */}
      {selectedStudent && (
        <>
          <NewJourneyWizard open={showJourneyWizard} onOpenChange={setShowJourneyWizard} studentId={selectedStudent.id} studentName={selectedStudent.full_name} onCreated={() => {}} onGoToWorkout={(journeyId, format) => { setActiveJourneyId(journeyId); setActiveJourneyFormat(format); setShowWorkoutInfo(true); }} />
          <WorkoutInfoDialog open={showWorkoutInfo} onOpenChange={setShowWorkoutInfo} journeyId={activeJourneyId} journeyFormat={activeJourneyFormat} studentId={selectedStudent.id} />
          <JourneyListDialog open={showJourneyList} onOpenChange={setShowJourneyList} studentId={selectedStudent.id} studentName={selectedStudent.full_name} professorName="" onOpenJourney={(j) => { setActiveJourney(j); setShowJourneyList(false); setShowJourneyWorkouts(true); }} onEditJourney={(j) => { setActiveJourney(j); setShowJourneyList(false); setShowJourneyEdit(true); }} />
          <JourneyWorkoutsDialog open={showJourneyWorkouts} onOpenChange={setShowJourneyWorkouts} journeyId={activeJourney?.id || ""} journeyName={activeJourney?.name || ""} journeyFormat={activeJourney?.format || ""} studentName={selectedStudent.full_name} />
          <JourneyEditDialog open={showJourneyEdit} onOpenChange={setShowJourneyEdit} journey={activeJourney} studentId={selectedStudent.id} studentName={selectedStudent.full_name} onUpdated={() => {}} onAddWorkout={(journeyId, format) => { setActiveJourneyId(journeyId); setActiveJourneyFormat(format); setShowWorkoutInfo(true); }} />
        </>
      )}
    </div>
  );
};

export default Students;
