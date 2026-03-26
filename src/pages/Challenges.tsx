import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trophy, Users, Calendar, Link2, Copy, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Challenge {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  invite_code: string;
  points_per_checkin: number;
  points_weekly_bonus: number;
  points_streak_bonus: number;
  source_journey_id: string | null;
  participant_count?: number;
}

interface Journey {
  id: string;
  name: string;
  student_id: string;
  objective: string;
  level: string;
  format: string;
  start_date: string;
  end_date: string;
}

const Challenges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sourceJourneyId, setSourceJourneyId] = useState("");
  const [pointsCheckin, setPointsCheckin] = useState(10);
  const [pointsWeekly, setPointsWeekly] = useState(25);
  const [pointsStreak, setPointsStreak] = useState(5);

  useEffect(() => {
    if (user) {
      fetchChallenges();
      fetchJourneys();
    }
  }, [user]);

  const fetchChallenges = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("professor_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Get participant counts
      const ids = data.map((c: any) => c.id);
      const { data: participants } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .in("challenge_id", ids.length > 0 ? ids : ["none"]);

      const counts: Record<string, number> = {};
      (participants || []).forEach((p: any) => {
        counts[p.challenge_id] = (counts[p.challenge_id] || 0) + 1;
      });

      setChallenges(data.map((c: any) => ({ ...c, participant_count: counts[c.id] || 0 })));
    }
    setLoading(false);
  };

  const fetchJourneys = async () => {
    const { data } = await supabase
      .from("workout_journeys")
      .select("id, name, student_id, objective, level, format, start_date, end_date")
      .eq("professor_id", user!.id)
      .order("created_at", { ascending: false });
    setJourneys(data || []);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setSourceJourneyId("");
    setPointsCheckin(10);
    setPointsWeekly(25);
    setPointsStreak(5);
  };

  const openEdit = (c: Challenge) => {
    setEditingChallenge(c);
    setName(c.name);
    setDescription(c.description || "");
    setStartDate(c.start_date);
    setEndDate(c.end_date);
    setSourceJourneyId(c.source_journey_id || "");
    setPointsCheckin(c.points_per_checkin);
    setPointsWeekly(c.points_weekly_bonus);
    setPointsStreak(c.points_streak_bonus);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !startDate || !endDate) {
      toast.error("Preencha nome, data de início e fim.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      start_date: startDate,
      end_date: endDate,
      source_journey_id: sourceJourneyId || null,
      points_per_checkin: pointsCheckin,
      points_weekly_bonus: pointsWeekly,
      points_streak_bonus: pointsStreak,
      professor_id: user!.id,
    };

    if (editingChallenge) {
      const { error } = await supabase.from("challenges").update(payload).eq("id", editingChallenge.id);
      if (error) { toast.error("Erro ao atualizar desafio"); return; }
      toast.success("Desafio atualizado!");
    } else {
      const { error } = await supabase.from("challenges").insert(payload);
      if (error) { toast.error("Erro ao criar desafio"); return; }
      toast.success("Desafio criado!");
    }

    setShowCreate(false);
    setEditingChallenge(null);
    resetForm();
    fetchChallenges();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este desafio?")) return;
    await supabase.from("challenges").delete().eq("id", id);
    toast.success("Desafio excluído");
    fetchChallenges();
  };

  const toggleStatus = async (c: Challenge) => {
    const newStatus = c.status === "active" ? "draft" : "active";
    await supabase.from("challenges").update({ status: newStatus }).eq("id", c.id);
    toast.success(newStatus === "active" ? "Desafio ativado!" : "Desafio pausado");
    fetchChallenges();
  };

  const copyLink = (c: Challenge) => {
    const link = `${window.location.origin}/challenge/${c.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link do desafio copiado!");
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/60 hover:bg-primary-foreground/15 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-primary-foreground font-display font-bold text-lg tracking-tight">DESAFIOS</h1>
              <p className="text-primary-foreground/40 text-xs">{challenges.length} desafio(s)</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setEditingChallenge(null); setShowCreate(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-foreground text-foreground rounded-xl font-display font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Novo Desafio
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center text-muted-foreground py-20">Carregando...</div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum desafio criado</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Crie seu primeiro desafio e compartilhe o link!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-foreground text-base">{c.name}</h3>
                    {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(c.status)}`}>
                    {c.status === "active" ? "ATIVO" : "RASCUNHO"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(c.start_date + "T12:00:00"), "dd/MM")} - {format(new Date(c.end_date + "T12:00:00"), "dd/MM/yy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {c.participant_count} inscritos
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span>✅ {c.points_per_checkin}pts/treino</span>
                  <span>🏅 {c.points_weekly_bonus}pts/semana</span>
                  <span>🔥 {c.points_streak_bonus}pts/streak</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                    <Link2 className="w-3 h-3" /> Copiar Link
                  </button>
                  <button onClick={() => navigate(`/challenge/${c.invite_code}`)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60 hover:bg-secondary/80 transition-colors" title="Ver ranking">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60 hover:bg-secondary/80 transition-colors" title="Editar">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleStatus(c)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60 hover:bg-secondary/80 transition-colors" title={c.status === "active" ? "Pausar" : "Ativar"}>
                    {c.status === "active" ? "⏸" : "▶"}
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors" title="Excluir">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditingChallenge(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingChallenge ? "Editar Desafio" : "Novo Desafio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do desafio *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="Ex: Desafio 30 dias de força" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" placeholder="Descreva o desafio..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Data de início *</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Data de término *</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Jornada de treinos (opcional)</label>
              <select value={sourceJourneyId} onChange={(e) => setSourceJourneyId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="">Sem jornada vinculada</option>
                {journeys.map((j) => (
                  <option key={j.id} value={j.id}>{j.name} ({j.objective} • {j.level})</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">A jornada será copiada para cada participante que se inscrever.</p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-display font-bold text-foreground mb-3">⚡ Pontuação</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Pts/treino</label>
                  <input type="number" value={pointsCheckin} onChange={(e) => setPointsCheckin(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bônus/semana</label>
                  <input type="number" value={pointsWeekly} onChange={(e) => setPointsWeekly(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bônus/streak</label>
                  <input type="number" value={pointsStreak} onChange={(e) => setPointsStreak(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                </div>
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-3 rounded-lg bg-foreground text-background font-display font-bold text-sm hover:opacity-90 transition-opacity">
              {editingChallenge ? "Salvar Alterações" : "Criar Desafio"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Challenges;
