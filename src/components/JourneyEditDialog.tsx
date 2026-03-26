import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft, X, Settings, Dumbbell, Pencil, Plus, Check, Save,
  CalendarDays, Target, Star, Award, Trophy, ListOrdered, Eye, EyeOff, Clock
} from "lucide-react";

interface Journey {
  id: string;
  name: string;
  objective: string;
  level: string;
  format: string;
  start_date: string;
  end_date: string;
  status: string | null;
}

interface Workout {
  id: string;
  name: string;
  day_label: string;
  orientations: string | null;
  sort_order: number | null;
}

type EditMode = "choice" | "journey" | "workouts" | "edit-workout" | "workout-choice";

interface JourneyEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journey: Journey | null;
  studentId: string;
  studentName: string;
  onUpdated?: () => void;
  onAddWorkout?: (journeyId: string, format: string) => void;
}

const OBJECTIVES = [
  "SAÚDE - T1",
  "QUALIDADE DE VIDA - T1",
  "HIPERTROFIA - T1",
  "EMAGRECIMENTO - T1",
];

const LEVELS = [
  { label: "Iniciante", icon: Star },
  { label: "Moderado", icon: Award },
  { label: "Avançado", icon: Trophy },
];

const JourneyEditDialog = ({
  open,
  onOpenChange,
  journey,
  studentId,
  studentName,
  onUpdated,
  onAddWorkout,
}: JourneyEditDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<EditMode>("choice");
  const [saving, setSaving] = useState(false);

  // Journey edit form
  const [journeyForm, setJourneyForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    orientations: "",
    objective: "",
    level: "",
    student_can_view: true,
    hide_on_expire: true,
    hide_until_start: true,
  });

  // Workouts list
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  // Edit single workout
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [workoutForm, setWorkoutForm] = useState({
    name: "",
    day_label: "",
    orientations: "",
  });

  useEffect(() => {
    if (!open) {
      setMode("choice");
      setEditingWorkout(null);
    }
  }, [open]);

  useEffect(() => {
    if (journey) {
      setJourneyForm({
        name: journey.name,
        start_date: journey.start_date,
        end_date: journey.end_date,
        orientations: "",
        objective: journey.objective,
        level: journey.level,
        student_can_view: true,
        hide_on_expire: true,
        hide_until_start: true,
      });
    }
  }, [journey]);

  const fetchJourneyFull = async () => {
    if (!journey) return;
    const { data } = await supabase
      .from("workout_journeys")
      .select("orientations, student_can_view, hide_on_expire, hide_until_start")
      .eq("id", journey.id)
      .single();
    if (data) {
      setJourneyForm((prev) => ({
        ...prev,
        orientations: data.orientations || "",
        student_can_view: data.student_can_view ?? true,
        hide_on_expire: data.hide_on_expire ?? true,
        hide_until_start: data.hide_until_start ?? true,
      }));
    }
  };

  const fetchWorkouts = async () => {
    if (!journey) return;
    setLoadingWorkouts(true);
    const { data, error } = await supabase
      .from("workouts")
      .select("id, name, day_label, orientations, sort_order")
      .eq("journey_id", journey.id)
      .order("sort_order", { ascending: true });
    if (error) toast.error("Erro ao carregar treinos");
    else setWorkouts(data || []);
    setLoadingWorkouts(false);
  };

  const handleEditJourney = () => {
    setMode("journey");
    fetchJourneyFull();
  };

  const handleEditWorkouts = () => {
    setMode("workouts");
    fetchWorkouts();
  };

  const handleSaveJourney = async () => {
    if (!journey) return;
    setSaving(true);
    const { error } = await supabase
      .from("workout_journeys")
      .update({
        name: journeyForm.name,
        start_date: journeyForm.start_date,
        end_date: journeyForm.end_date,
        orientations: journeyForm.orientations,
        objective: journeyForm.objective,
        level: journeyForm.level,
        student_can_view: journeyForm.student_can_view,
        hide_on_expire: journeyForm.hide_on_expire,
        hide_until_start: journeyForm.hide_until_start,
      })
      .eq("id", journey.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Jornada atualizada!");
      onUpdated?.();
      onOpenChange(false);
    }
  };

  const handleEditWorkout = (w: Workout) => {
    setEditingWorkout(w);
    setWorkoutForm({
      name: w.name,
      day_label: w.day_label,
      orientations: w.orientations || "",
    });
    setMode("workout-choice");
  };

  const handleEditWorkoutInfo = () => {
    setMode("edit-workout");
  };

  const handleEditWorkoutExercises = () => {
    if (!editingWorkout || !studentId || !journey) return;
    onOpenChange(false);
    navigate(`/workout/${studentId}?workoutId=${editingWorkout.id}&journeyId=${journey.id}&journeyFormat=${encodeURIComponent(journey.format)}`);
  };

  const handleSaveWorkout = async () => {
    if (!editingWorkout) return;
    setSaving(true);
    const { error } = await supabase
      .from("workouts")
      .update({
        name: workoutForm.name,
        day_label: workoutForm.day_label,
        orientations: workoutForm.orientations,
      })
      .eq("id", editingWorkout.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar treino");
    else {
      toast.success("Treino atualizado!");
      setMode("workouts");
      fetchWorkouts();
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) toast.error("Erro ao remover treino");
    else {
      toast.success("Treino removido");
      fetchWorkouts();
    }
  };

  const isWeekly = journey?.format.toLowerCase() === "semanal";
  const WEEK_DAYS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
  const NUMERIC_OPTIONS = Array.from({ length: 10 }, (_, i) => `Treino ${i + 1}`);
  const dayOptions = isWeekly ? WEEK_DAYS : NUMERIC_OPTIONS;

  const getTitle = () => {
    if (mode === "choice") return "O que deseja editar?";
    if (mode === "journey") return "Editar Jornada";
    if (mode === "workouts") return "Treinos da Jornada";
    if (mode === "workout-choice") return "Editar Treino";
    if (mode === "edit-workout") return "Editar Informações";
    return "";
  };

  const handleBack = () => {
    if (mode === "edit-workout") setMode("workout-choice");
    else if (mode === "workout-choice") setMode("workouts");
    else if (mode === "journey" || mode === "workouts") setMode("choice");
    else onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-foreground px-4 py-4 text-primary-foreground flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/15 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-base">{getTitle()}</h2>
            <p className="text-primary-foreground/50 text-xs">{journey?.name} • {studentName}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 max-h-[65vh] overflow-y-auto scrollbar-thin space-y-4">
          {/* CHOICE MODE */}
          {mode === "choice" && (
            <>
              <button
                onClick={handleEditJourney}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-sm text-foreground">Editar Jornada</p>
                  <p className="text-xs text-muted-foreground">Alterar informações da jornada</p>
                </div>
              </button>
              <button
                onClick={handleEditWorkouts}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[hsl(150,60%,45%)/0.1] flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-[hsl(150,60%,45%)]" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-sm text-foreground">Editar Treinos</p>
                  <p className="text-xs text-muted-foreground">Gerenciar treinos desta jornada</p>
                </div>
              </button>
            </>
          )}

          {/* JOURNEY EDIT MODE */}
          {mode === "journey" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nome da Jornada *</label>
                <input
                  value={journeyForm.name}
                  onChange={(e) => setJourneyForm({ ...journeyForm, name: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Início</label>
                  <input
                    type="date"
                    value={journeyForm.start_date}
                    onChange={(e) => setJourneyForm({ ...journeyForm, start_date: e.target.value })}
                    className="w-full mt-0.5 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fim</label>
                  <input
                    type="date"
                    value={journeyForm.end_date}
                    onChange={(e) => setJourneyForm({ ...journeyForm, end_date: e.target.value })}
                    className="w-full mt-0.5 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className="text-sm font-medium text-foreground">Objetivo</label>
                <div className="space-y-2 mt-2">
                  {OBJECTIVES.map((obj) => (
                    <button
                      key={obj}
                      onClick={() => setJourneyForm({ ...journeyForm, objective: obj })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm ${
                        journeyForm.objective === obj
                          ? "border-primary bg-primary/5 font-bold text-foreground"
                          : "border-border text-muted-foreground hover:border-muted-foreground/30"
                      }`}
                    >
                      <Target className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{obj}</span>
                      {journeyForm.objective === obj && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="text-sm font-medium text-foreground">Nível</label>
                <div className="flex gap-2 mt-2">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl.label}
                      onClick={() => setJourneyForm({ ...journeyForm, level: lvl.label })}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${
                        journeyForm.level === lvl.label
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/30"
                      }`}
                    >
                      <lvl.icon className="w-4 h-4" />
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientations */}
              <div>
                <label className="text-sm font-medium text-foreground">Orientações</label>
                <textarea
                  value={journeyForm.orientations}
                  onChange={(e) => setJourneyForm({ ...journeyForm, orientations: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                {[
                  { key: "student_can_view" as const, label: "Aluno pode visualizar", icon: Eye },
                  { key: "hide_on_expire" as const, label: "Ocultar ao expirar", icon: EyeOff },
                  { key: "hide_until_start" as const, label: "Ocultar até início", icon: Clock },
                ].map((c) => (
                  <label key={c.key} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setJourneyForm({ ...journeyForm, [c.key]: !journeyForm[c.key] })}
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        journeyForm[c.key] ? "bg-primary" : "bg-secondary border border-border"
                      }`}
                    >
                      {journeyForm[c.key] && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm text-foreground">{c.label}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleSaveJourney}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          )}

          {/* WORKOUTS LIST MODE */}
          {mode === "workouts" && (
            <div className="space-y-3">
              {loadingWorkouts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {workouts.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">Nenhum treino criado</p>
                  )}
                  {workouts.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[hsl(250,55%,50%)/0.1] flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-[hsl(250,55%,50%)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-foreground truncate">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.day_label}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditWorkout(w)}
                          className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkout(w.id)}
                          className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                          title="Remover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add new workout button */}
                  <button
                    onClick={() => {
                      if (journey && onAddWorkout) {
                        onOpenChange(false);
                        onAddWorkout(journey.id, journey.format);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary font-display font-bold text-sm hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Novo Treino
                  </button>
                </>
              )}
            </div>
          )}

          {/* WORKOUT CHOICE MODE - Info or Exercises */}
          {mode === "workout-choice" && editingWorkout && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(250,55%,50%)/0.1] flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-[hsl(250,55%,50%)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-foreground truncate">{editingWorkout.name}</p>
                  <p className="text-xs text-muted-foreground">{editingWorkout.day_label}</p>
                </div>
              </div>
              <button
                onClick={handleEditWorkoutInfo}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-sm text-foreground">Editar Informações</p>
                  <p className="text-xs text-muted-foreground">Nome, forma e orientações do treino</p>
                </div>
              </button>
              <button
                onClick={handleEditWorkoutExercises}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[hsl(150,60%,45%)/0.1] flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-[hsl(150,60%,45%)]" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-sm text-foreground">Editar Exercícios</p>
                  <p className="text-xs text-muted-foreground">Abrir montagem de treino</p>
                </div>
              </button>
            </div>
          )}

          {/* EDIT SINGLE WORKOUT MODE */}
          {mode === "edit-workout" && editingWorkout && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Forma do Treino *</label>
                <select
                  value={workoutForm.day_label}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, day_label: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                >
                  <option value="" disabled>Selecione</option>
                  {dayOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Nome do Treino *</label>
                <input
                  value={workoutForm.name}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Orientações</label>
                <textarea
                  value={workoutForm.orientations}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, orientations: e.target.value })}
                  rows={4}
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <button
                onClick={handleSaveWorkout}
                disabled={saving || !workoutForm.name.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar Treino"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyEditDialog;
