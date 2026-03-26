import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, DollarSign, AlertTriangle, CalendarClock, Plus, Check, X, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, differenceInDays, startOfMonth, endOfMonth, addMonths, isBefore, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Payment = {
  id: string;
  professor_id: string;
  student_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  students?: { full_name: string; plan_id: string | null } | null;
};

type Student = {
  id: string;
  full_name: string;
  plan_id: string | null;
  payment_day: number | null;
  status: string | null;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  periodicity: string;
};

const Financial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "overdue">("all");
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));

  // New payment form
  const [formStudentId, setFormStudentId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDate, setFormDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formMethod, setFormMethod] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Generate month
  const [genMonth, setGenMonth] = useState(format(addMonths(new Date(), 1), "yyyy-MM"));

  useEffect(() => {
    if (user) fetchAll();
  }, [user, selectedMonth]);

  const fetchAll = async () => {
    setLoading(true);
    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(monthStart);

    const [paymentsRes, studentsRes, plansRes] = await Promise.all([
      supabase
        .from("payments")
        .select("*, students(full_name, plan_id)")
        .eq("professor_id", user!.id)
        .gte("due_date", format(monthStart, "yyyy-MM-dd"))
        .lte("due_date", format(monthEnd, "yyyy-MM-dd"))
        .order("due_date"),
      supabase.from("students").select("id, full_name, plan_id, payment_day, status").eq("professor_id", user!.id).eq("status", "active").order("full_name"),
      supabase.from("plans").select("*").eq("professor_id", user!.id),
    ]);

    setPayments((paymentsRes.data as any) || []);
    setStudents(studentsRes.data || []);
    setPlans(plansRes.data || []);
    setLoading(false);
  };

  const planMap = useMemo(() => {
    const m: Record<string, Plan> = {};
    plans.forEach(p => m[p.id] = p);
    return m;
  }, [plans]);

  const today = new Date();

  const enrichedPayments = useMemo(() => {
    return payments.map(p => {
      const realStatus = p.status === "paid" ? "paid" : (isBefore(parseISO(p.due_date), today) ? "overdue" : "pending");
      return { ...p, realStatus };
    });
  }, [payments]);

  const filtered = useMemo(() => {
    let list = enrichedPayments;
    if (filterStatus !== "all") list = list.filter(p => p.realStatus === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => (p.students?.full_name || "").toLowerCase().includes(s));
    }
    return list;
  }, [enrichedPayments, filterStatus, search]);

  const stats = useMemo(() => {
    const totalExpected = enrichedPayments.reduce((s, p) => s + p.amount, 0);
    const totalReceived = enrichedPayments.filter(p => p.realStatus === "paid").reduce((s, p) => s + p.amount, 0);
    const overdueCount = enrichedPayments.filter(p => p.realStatus === "overdue").length;
    const upcomingCount = enrichedPayments.filter(p => p.realStatus === "pending").length;
    return { totalExpected, totalReceived, overdueCount, upcomingCount };
  }, [enrichedPayments]);

  const markPaid = async (paymentId: string) => {
    const { error } = await supabase.from("payments").update({ status: "paid", paid_date: format(today, "yyyy-MM-dd") }).eq("id", paymentId);
    if (error) { toast.error("Erro ao confirmar pagamento"); return; }
    toast.success("Pagamento confirmado!");
    fetchAll();
  };

  const markUnpaid = async (paymentId: string) => {
    const { error } = await supabase.from("payments").update({ status: "pending", paid_date: null }).eq("id", paymentId);
    if (error) { toast.error("Erro"); return; }
    toast.success("Pagamento revertido");
    fetchAll();
  };

  const handleNewPayment = async () => {
    if (!formStudentId || !formAmount || !formDueDate) { toast.error("Preencha aluno, valor e vencimento"); return; }
    const { error } = await supabase.from("payments").insert({
      professor_id: user!.id,
      student_id: formStudentId,
      amount: parseFloat(formAmount),
      due_date: formDueDate,
      payment_method: formMethod || null,
      notes: formNotes || null,
    });
    if (error) { toast.error("Erro ao criar cobrança"); return; }
    toast.success("Cobrança criada!");
    setShowNewPayment(false);
    setFormStudentId(""); setFormAmount(""); setFormMethod(""); setFormNotes("");
    fetchAll();
  };

  const handleGenerateMonth = async () => {
    const monthDate = parseISO(genMonth + "-01");
    let count = 0;
    for (const st of students) {
      if (!st.plan_id || !st.payment_day) continue;
      const plan = planMap[st.plan_id];
      if (!plan) continue;
      const day = Math.min(st.payment_day, 28);
      const dueDate = format(new Date(monthDate.getFullYear(), monthDate.getMonth(), day), "yyyy-MM-dd");
      const { data: existing } = await supabase.from("payments").select("id").eq("student_id", st.id).eq("due_date", dueDate).eq("professor_id", user!.id).maybeSingle();
      if (existing) continue;
      await supabase.from("payments").insert({ professor_id: user!.id, student_id: st.id, amount: plan.price, due_date: dueDate });
      count++;
    }
    toast.success(`${count} cobranças geradas para ${format(monthDate, "MMMM/yyyy", { locale: ptBR })}`);
    setShowGenerate(false);
    fetchAll();
  };

  const statusColors: Record<string, string> = {
    paid: "bg-green-500/10 text-green-700 dark:text-green-400",
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    overdue: "bg-destructive/10 text-destructive",
  };
  const statusLabels: Record<string, string> = { paid: "Pago", pending: "Pendente", overdue: "Atrasado" };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4">
          <button onClick={() => navigate("/dashboard")} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/60 hover:text-primary-foreground shrink-0"><ArrowLeft className="w-4 h-4" /></button>
          <div className="min-w-0">
            <h1 className="text-primary-foreground font-bold text-base sm:text-lg truncate">Painel Financeiro</h1>
            <p className="text-primary-foreground/40 text-[10px] sm:text-xs">Receitas, cobranças e inadimplência</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"><TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" /><span className="text-[10px] sm:text-xs text-muted-foreground">Previsto</span></div>
            <p className="text-base sm:text-xl font-bold text-foreground">R$ {stats.totalExpected.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"><DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" /><span className="text-[10px] sm:text-xs text-muted-foreground">Recebido</span></div>
            <p className="text-base sm:text-xl font-bold text-green-600">R$ {stats.totalReceived.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"><AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" /><span className="text-[10px] sm:text-xs text-muted-foreground">Atrasados</span></div>
            <p className="text-base sm:text-xl font-bold text-destructive">{stats.overdueCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"><CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600" /><span className="text-[10px] sm:text-xs text-muted-foreground">Pendentes</span></div>
            <p className="text-base sm:text-xl font-bold text-foreground">{stats.upcomingCount}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full sm:w-auto px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm" />
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar aluno..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(["all", "pending", "overdue", "paid"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {s === "all" ? "Todos" : statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowGenerate(true)} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-secondary text-foreground text-xs sm:text-sm font-medium hover:bg-secondary/80">
              Gerar Cobranças
            </button>
            <button onClick={() => { setFormStudentId(""); setFormAmount(""); setFormDueDate(format(new Date(), "yyyy-MM-dd")); setFormMethod(""); setFormNotes(""); setShowNewPayment(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-foreground text-background text-xs sm:text-sm font-bold hover:opacity-90">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Nova Cobrança
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Aluno</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Vencimento</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Valor</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Nenhuma cobrança encontrada</td></tr>
                )}
                {filtered.map(p => {
                  const daysLate = p.realStatus === "overdue" ? differenceInDays(today, parseISO(p.due_date)) : 0;
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{p.students?.full_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(parseISO(p.due_date), "dd/MM/yyyy")}
                        {daysLate > 0 && <span className="ml-2 text-xs text-destructive">({daysLate}d atraso)</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">R$ {p.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.realStatus]}`}>{statusLabels[p.realStatus]}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.realStatus !== "paid" ? (
                          <button onClick={() => markPaid(p.id)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-500/20">
                            <Check className="w-3 h-3" /> Confirmar
                          </button>
                        ) : (
                          <button onClick={() => markUnpaid(p.id)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80">
                            <X className="w-3 h-3" /> Reverter
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Payment Dialog */}
      <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova Cobrança</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Aluno</label>
              <select value={formStudentId} onChange={e => setFormStudentId(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground">
                <option value="">Selecione...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Valor (R$)</label>
              <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground" placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Vencimento</label>
              <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Método (opcional)</label>
              <select value={formMethod} onChange={e => setFormMethod(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground">
                <option value="">—</option>
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Observação (opcional)</label>
              <input value={formNotes} onChange={e => setFormNotes(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground" />
            </div>
            <button onClick={handleNewPayment} className="w-full py-3 rounded-lg bg-foreground text-background font-bold text-sm hover:opacity-90">Criar Cobrança</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Payments Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Gerar Cobranças Automáticas</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Gera cobranças para todos os alunos ativos que possuem plano e dia de pagamento configurados. Não duplica cobranças já existentes.</p>
            <div>
              <label className="text-sm font-medium text-foreground">Mês de referência</label>
              <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground" />
            </div>
            <button onClick={handleGenerateMonth} className="w-full py-3 rounded-lg bg-foreground text-background font-bold text-sm hover:opacity-90">Gerar Cobranças</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financial;
