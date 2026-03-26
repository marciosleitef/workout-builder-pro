import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, CalendarDays, Dumbbell, Info, ChevronDown, ChevronUp,
  Printer, Play, Link2, Clock, Flame, CheckCircle2, Activity,
  Zap, Moon, Brain, Smile, TrendingUp, Droplets, Thermometer, Square,
  Video, Eye, Hash, RotateCw, Timer, Gauge, Ruler, Wind, Check
} from "lucide-react";

interface WorkoutExerciseData {
  id: string;
  exercise: { name: string; pilar?: string; classe?: string; videoUrl?: string };
  sets?: string;
  reps?: string;
  load?: string;
  rest?: string;
  speed?: string;
  distance?: string;
  duration?: string;
  breathing?: string;
  calories?: string;
  notes?: string;
}

interface BiSetData {
  id: string;
  type: "biset";
  exercises: WorkoutExerciseData[];
}

interface ExerciseGroupData {
  id: string;
  name: string;
  color: string;
  items: (WorkoutExerciseData | BiSetData)[];
}

interface Workout {
  id: string;
  name: string;
  day_label: string;
  orientations: string | null;
  sort_order: number | null;
  exercises_data: ExerciseGroupData[] | null;
}

interface JourneyWorkoutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyId: string;
  journeyName: string;
  journeyFormat: string;
  studentName: string;
  studentId?: string;
}

// Scale definitions
const PRE_SCALES = [
  { key: "fatigue_scale", label: "Fadiga", icon: Zap, min: 1, max: 5,
    labels: { 1: "Sempre Cansado", 2: "Mais Cansado que o normal", 3: "Normal", 4: "Descansado", 5: "Muito descansado" } },
  { key: "sleep_quality_scale", label: "Qualidade do Sono", icon: Moon, min: 1, max: 5,
    labels: { 1: "Insônia", 2: "Sono inquieto", 3: "Dificuldade de adormecer", 4: "Bom", 5: "Muito Tranquilo" } },
  { key: "muscle_soreness_scale", label: "Dor Muscular Geral", icon: Activity, min: 1, max: 5,
    labels: { 1: "Muito dolorido", 2: "Aumento de dores", 3: "Normal", 4: "Sentindo-me Bem", 5: "Sentindo-me ótimo(a)" } },
  { key: "stress_level_scale", label: "Nível de Estresse", icon: Brain, min: 1, max: 5,
    labels: { 1: "Altamente estressado", 2: "Estressado", 3: "Normal", 4: "Relaxado(a)", 5: "Muito Relaxado(a)" } },
  { key: "mood_scale", label: "Humor", icon: Smile, min: 1, max: 5,
    labels: { 1: "Muito aborrecido(a)", 2: "Menos interessado", 3: "Normal", 4: "Bom humor", 5: "Muito bom humor" } },
  { key: "recovery_perception_scale", label: "Percepção de Recuperação", icon: TrendingUp, min: 0, max: 10,
    labels: { 0: "Nenhuma", 1: "Muito Pouco", 2: "Pouco", 3: "Moderada", 4: "Boa", 5: "Muito boa", 6: "Avançada", 7: "Quase Completa", 8: "Estável", 9: "Consolidada", 10: "Recuperado" } },
  { key: "urine_color_scale", label: "Cor de Urina", icon: Droplets, min: 1, max: 8,
    labels: { 1: "Muito bem hidratado", 2: "Bem hidratado", 3: "Adequada", 4: "Aceitável", 5: "Leve desidratação", 6: "Moderada", 7: "Significativa", 8: "Grave" } },
];

const POST_SCALES = [
  { key: "post_recovery_scale", label: "Percepção de Recuperação", icon: TrendingUp, min: 0, max: 10,
    labels: { 0: "Nenhuma", 1: "Muito Pouco", 2: "Pouco", 3: "Moderada", 4: "Boa", 5: "Muito Boa", 6: "Avançada", 7: "Quase Completa", 8: "Estável", 9: "Consolidada", 10: "Recuperado" } },
  { key: "perceived_exertion_scale", label: "Percepção de Esforço", icon: Flame, min: 0, max: 10,
    labels: { 0: "Nada", 1: "Extremamente fraco", 2: "Muito fraco", 3: "Fraco", 4: "Moderado", 5: "Pouco forte", 6: "Forte", 7: "Muito forte", 8: "Pesado", 9: "Quase máximo", 10: "Máximo" } },
  { key: "pain_scale_eva", label: "Escala de Dor (EVA)", icon: Thermometer, min: 0, max: 10,
    labels: { 0: "Sem dor", 1: "Mínima", 2: "Leve", 3: "Leve a moderada", 4: "Moderada", 5: "Moderada contínua", 6: "Moderada a intensa", 7: "Intensa", 8: "Muito intensa", 9: "Quase insuportável", 10: "Insuportável" } },
];

const URINE_COLORS = ["#F5F5DC", "#FFFACD", "#FFEB3B", "#FFD54F", "#FFB74D", "#FF9800", "#E65100", "#BF360C"];

const PARAM_FIELDS = [
  { key: "sets", label: "Séries", icon: Hash },
  { key: "reps", label: "Repetições", icon: RotateCw },
  { key: "load", label: "Carga (kg)", icon: Dumbbell },
  { key: "rest", label: "Intervalo (seg)", icon: Timer },
  { key: "speed", label: "Velocidade", icon: Gauge },
  { key: "distance", label: "Distância (m)", icon: Ruler },
  { key: "duration", label: "Tempo (min)", icon: Clock },
  { key: "breathing", label: "Respiração", icon: Wind },
  { key: "calories", label: "Meta de calorias", icon: Flame },
] as const;

function getScaleColor(value: number, max: number, inverted = false) {
  const ratio = value / max;
  const r = inverted ? ratio : 1 - ratio;
  if (r < 0.3) return "hsl(var(--accent))";
  if (r < 0.6) return "hsl(var(--primary))";
  return "hsl(var(--destructive))";
}

// Step-by-step scale question component
function StepScaleQuestion({ scale, onSelect }: { scale: typeof PRE_SCALES[0]; onSelect: (v: number) => void }) {
  const Icon = scale.icon;
  const isUrine = scale.key === "urine_color_scale";
  const options = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);

  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display font-bold text-lg text-foreground text-center mb-1">{scale.label}</h3>
      <p className="text-xs text-muted-foreground mb-4">Selecione o valor que melhor representa seu estado</p>
      <div className="w-full space-y-1.5">
        {options.map((v) => (
          <button key={v} onClick={() => onSelect(v)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all hover:bg-primary/10 hover:scale-[1.01] active:scale-[0.99] border border-border bg-card">
            {isUrine ? (
              <div className="w-7 h-7 rounded-full border border-border shrink-0 shadow-sm" style={{ backgroundColor: URINE_COLORS[v - 1] }} />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: getScaleColor(v, scale.max), color: "white" }}>
                {v}
              </div>
            )}
            <span className="font-medium text-foreground">{(scale.labels as any)[v]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Video player component
function VideoPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <video src={url} controls autoPlay className="w-full rounded-xl" />
        <button onClick={onClose} className="mt-3 w-full py-2 rounded-xl bg-white/20 text-white text-sm font-bold hover:bg-white/30 transition-colors">
          Fechar
        </button>
      </div>
    </div>
  );
}

type Phase = "workouts" | "checkin" | "active" | "checkout" | "metrics" | "done";

const JourneyWorkoutsDialog = ({
  open, onOpenChange, journeyId, journeyName, journeyFormat, studentName, studentId,
}: JourneyWorkoutsDialogProps) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOrientations, setShowOrientations] = useState(false);

  // Workout session flow
  const [phase, setPhase] = useState<Phase>("workouts");
  const [currentStep, setCurrentStep] = useState(0);
  const [checkinForm, setCheckinForm] = useState<Record<string, any>>({});
  const [checkoutForm, setCheckoutForm] = useState<Record<string, any>>({});
  const [metricsForm, setMetricsForm] = useState({ workout_bpm_avg: "", workout_bpm_max: "", calories_burned: "" });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  // Active workout state
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open && journeyId) fetchWorkouts();
    if (!open) {
      setSelectedWorkout(null);
      setShowOrientations(false);
      setPhase("workouts");
      setCurrentStep(0);
      setCheckinForm({});
      setCheckoutForm({});
      setMetricsForm({ workout_bpm_avg: "", workout_bpm_max: "", calories_burned: "" });
      setStartTime(null);
      setCompletedExercises(new Set());
      setExpandedGroups(new Set());
      setExpandedExercise(null);
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open, journeyId]);

  useEffect(() => {
    if (phase === "active" && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase, startTime]);

  const fetchWorkouts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("workouts").select("id, name, day_label, orientations, sort_order, exercises_data")
      .eq("journey_id", journeyId).order("sort_order", { ascending: true });
    if (error) toast.error("Erro ao carregar treinos");
    else {
      const mapped = (data || []).map((w) => ({ ...w, exercises_data: (w.exercises_data as unknown as ExerciseGroupData[]) || [] }));
      setWorkouts(mapped);
      if (mapped.length > 0) setSelectedWorkout(mapped[0]);
    }
    setLoading(false);
  };

  const handleStartWorkout = () => {
    if (!selectedWorkout) return;
    setCheckinForm({});
    setPhase("checkin");
  };

  const handleSubmitCheckin = async () => {
    if (!user || !studentId || !selectedWorkout) return;
    setSaving(true);
    await supabase.from("workout_session_feedback").insert({
      student_id: studentId,
      professor_id: user.id,
      feedback_type: "pre",
      session_date: new Date().toISOString().split("T")[0],
      checkin_time: new Date().toISOString(),
      fatigue_scale: checkinForm.fatigue_scale || null,
      sleep_quality_scale: checkinForm.sleep_quality_scale || null,
      muscle_soreness_scale: checkinForm.muscle_soreness_scale || null,
      stress_level_scale: checkinForm.stress_level_scale || null,
      mood_scale: checkinForm.mood_scale || null,
      recovery_perception_scale: checkinForm.recovery_perception_scale || null,
      urine_color_scale: checkinForm.urine_color_scale || null,
    } as any);

    await supabase.from("workout_checkins").insert({
      student_id: studentId,
      professor_id: user.id,
      journey_id: journeyId,
      workout_id: selectedWorkout.id,
      checked_in_by: user.id,
    });

    setSaving(false);
    const now = new Date();
    setStartTime(now);
    setCompletedExercises(new Set());
    toast.success("Check-in registrado! Bom treino! 💪");
    setPhase("active");
  };

  const handleFinishWorkout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCheckoutForm({});
    setPhase("checkout");
  };

  const handleSubmitCheckout = () => {
    setPhase("metrics");
  };

  const handleSubmitMetrics = async () => {
    if (!user || !studentId) return;
    setSaving(true);
    // Calculate training duration in minutes
    const trainingDurationMin = startTime ? Math.round((Date.now() - startTime.getTime()) / 60000) : null;
    
    await supabase.from("workout_session_feedback").insert({
      student_id: studentId,
      professor_id: user.id,
      feedback_type: "post",
      session_date: new Date().toISOString().split("T")[0],
      checkout_time: new Date().toISOString(),
      checkin_time: startTime?.toISOString() || null,
      post_recovery_scale: checkoutForm.post_recovery_scale || null,
      perceived_exertion_scale: checkoutForm.perceived_exertion_scale || null,
      pain_scale_eva: checkoutForm.pain_scale_eva || null,
      workout_bpm_avg: parseInt(metricsForm.workout_bpm_avg) || null,
      workout_bpm_max: parseInt(metricsForm.workout_bpm_max) || null,
      calories_burned: parseInt(metricsForm.calories_burned) || null,
    } as any);
    setSaving(false);
    toast.success("Treino finalizado! Dados registrados ✅");
    setPhase("done");
  };

  const toggleExerciseComplete = (exId: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const isWeekly = journeyFormat.toLowerCase() === "semanal";
  const isBiSetData = (item: WorkoutExerciseData | BiSetData): item is BiSetData =>
    "type" in item && item.type === "biset";
  const groups = selectedWorkout?.exercises_data || [];
  const hasExercises = groups.some((g) => g.items.length > 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalExCount = groups.reduce((acc, g) => acc + g.items.reduce((a, item) => a + (isBiSetData(item) ? item.exercises.length : 1), 0), 0);
  const completedCount = completedExercises.size;

  // ── Exercise item with params and video ──
  const renderExerciseItemFull = (ex: WorkoutExerciseData, isActive: boolean) => {
    const isCompleted = completedExercises.has(ex.id);
    const isExpanded = expandedExercise === ex.id;
    const hasParams = PARAM_FIELDS.some((f) => (ex as any)[f.key]);
    const hasVideo = !!ex.exercise.videoUrl;

    return (
      <div key={ex.id} className={`transition-colors ${isCompleted && isActive ? "bg-accent/5" : ""}`}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          {isActive && (
            <button onClick={() => toggleExerciseComplete(ex.id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isCompleted ? "bg-accent border-accent" : "border-muted-foreground/40 hover:border-primary"}`}>
              {isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          )}
          <Dumbbell className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <button onClick={() => setExpandedExercise(isExpanded ? null : ex.id)} className="flex-1 min-w-0 text-left">
            <p className={`text-sm truncate ${isCompleted && isActive ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {ex.exercise.name}
            </p>
            {(ex.sets || ex.reps || ex.load) && (
              <p className="text-[10px] text-muted-foreground">
                {ex.sets && `${ex.sets}x`}{ex.reps || ""} {ex.load ? `• ${ex.load}kg` : ""} {ex.rest ? `• Desc: ${ex.rest}s` : ""}
              </p>
            )}
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {hasVideo && (
              <button onClick={() => setVideoUrl(ex.exercise.videoUrl!)}
                className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Video className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
            {hasParams && (
              <button onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        {/* Expanded params */}
        {isExpanded && (
          <div className="px-4 pb-3 pt-0">
            <div className="grid grid-cols-3 gap-2">
              {PARAM_FIELDS.filter((f) => (ex as any)[f.key]).map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.key} className="bg-secondary/50 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[9px] text-muted-foreground leading-tight">{f.label}</p>
                      <p className="text-xs font-bold text-foreground">{(ex as any)[f.key]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {ex.notes && (
              <div className="mt-2 bg-secondary/50 rounded-lg px-2 py-1.5">
                <p className="text-[9px] text-muted-foreground">Observações</p>
                <p className="text-xs text-foreground">{ex.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Simple exercise item (no interaction)
  const renderExerciseItemSimple = (ex: WorkoutExerciseData) => renderExerciseItemFull(ex, false);

  // ── Collapsible group ──
  const renderGroup = (group: ExerciseGroupData, isActive: boolean) => {
    const isOpen = expandedGroups.has(group.id);
    const groupExCount = group.items.reduce((a, item) => a + (isBiSetData(item) ? item.exercises.length : 1), 0);
    const groupCompletedCount = group.items.reduce((a, item) => {
      if (isBiSetData(item)) return a + item.exercises.filter((e) => completedExercises.has(e.id)).length;
      return a + (completedExercises.has(item.id) ? 1 : 0);
    }, 0);

    return (
      <div key={group.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: group.color, borderColor: group.color.replace("0.15", "0.4") }}>
        <button onClick={() => toggleGroupExpanded(group.id)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/5 transition-colors">
          <div className="flex items-center gap-2">
            <p className="text-xs font-display font-bold text-foreground uppercase tracking-wide">{group.name}</p>
            {isActive && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {groupCompletedCount}/{groupExCount}
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {isOpen && (
          <div className="bg-background/60 divide-y divide-border/50">
            {group.items.map((item) =>
              isBiSetData(item) ? (
                <div key={item.id} className="border-l-2 border-primary/50">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5">
                    <Link2 className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-display font-semibold text-primary">Bi-Set</span>
                  </div>
                  {item.exercises.map((ex) => renderExerciseItemFull(ex, isActive))}
                </div>
              ) : renderExerciseItemFull(item, isActive)
            )}
          </div>
        )}
      </div>
    );
  };

  // ── CHECKIN PHASE ──
  const renderCheckin = () => (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-[hsl(150,55%,45%)] to-[hsl(170,50%,45%)] rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5" />
          <h3 className="font-display font-bold">Pré-Treino (Check-in)</h3>
        </div>
        <p className="text-white/70 text-xs">Responda as escalas antes de iniciar o treino</p>
      </div>
      {PRE_SCALES.map((scale) => (
        <ScaleSelector key={scale.key} scale={scale} value={checkinForm[scale.key] ?? null}
          onChange={(v) => setCheckinForm({ ...checkinForm, [scale.key]: v })} />
      ))}
      <button onClick={handleSubmitCheckin} disabled={saving}
        className="w-full py-3 rounded-xl bg-[hsl(150,55%,45%)] text-white font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
        {saving ? "Salvando..." : "Confirmar Check-in e Iniciar Treino"}
      </button>
    </div>
  );

  // ── ACTIVE PHASE ──
  const renderActive = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[hsl(220,60%,50%)] to-[hsl(250,55%,50%)] rounded-xl p-4 text-white text-center">
        <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
        <h3 className="font-display font-bold text-lg">Treino em Andamento</h3>
        <p className="text-white/70 text-sm">{selectedWorkout?.name}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="text-2xl font-display font-bold font-mono">{formatTime(elapsedSeconds)}</p>
            <p className="text-white/60 text-[10px]">tempo</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="text-2xl font-display font-bold">{completedCount}/{totalExCount}</p>
            <p className="text-white/60 text-[10px]">exercícios</p>
          </div>
        </div>
      </div>

      {/* Collapsible exercise groups */}
      {hasExercises && (
        <div className="space-y-3">
          {groups.map((group) => renderGroup(group, true))}
        </div>
      )}

      <button onClick={handleFinishWorkout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive text-destructive-foreground font-display font-bold text-sm hover:bg-destructive/90 transition-colors">
        <Square className="w-4 h-4" />
        Finalizar Treino
      </button>
    </div>
  );

  // ── CHECKOUT PHASE ──
  const renderCheckout = () => (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-destructive to-[hsl(0,55%,45%)] rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5" />
          <h3 className="font-display font-bold">Pós-Treino (Check-out)</h3>
        </div>
        <p className="text-white/70 text-xs">Como foi o treino? Avalie suas sensações</p>
      </div>
      {POST_SCALES.map((scale) => (
        <ScaleSelector key={scale.key} scale={scale} value={checkoutForm[scale.key] ?? null}
          onChange={(v) => setCheckoutForm({ ...checkoutForm, [scale.key]: v })} />
      ))}
      <button onClick={handleSubmitCheckout}
        className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-display font-bold text-sm hover:opacity-90 transition-opacity">
        Confirmar Check-out
      </button>
    </div>
  );

  // ── METRICS PHASE ──
  const renderMetrics = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[hsl(35,85%,50%)] to-[hsl(25,80%,50%)] rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5" />
          <h3 className="font-display font-bold">Métricas do Treino</h3>
        </div>
        <p className="text-white/70 text-xs">Informe os dados do treino</p>
      </div>
      <div className="space-y-3">
        {[
          { key: "workout_bpm_avg", label: "BPM Médio", icon: "❤️", placeholder: "Ex: 135" },
          { key: "workout_bpm_max", label: "BPM Máximo", icon: "💓", placeholder: "Ex: 175" },
          { key: "calories_burned", label: "Calorias Gastas", icon: "🔥", placeholder: "Ex: 450" },
        ].map((f) => (
          <div key={f.key}>
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <span>{f.icon}</span> {f.label}
            </label>
            <input type="number" placeholder={f.placeholder}
              value={(metricsForm as any)[f.key]}
              onChange={(e) => setMetricsForm({ ...metricsForm, [f.key]: e.target.value })}
              className="w-full mt-1 px-3 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none" />
          </div>
        ))}
      </div>
      <button onClick={handleSubmitMetrics} disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
        {saving ? "Salvando..." : "Finalizar e Salvar"}
      </button>
    </div>
  );

  const trainingMinutes = startTime ? Math.round(elapsedSeconds / 60) : 0;

  // ── DONE PHASE ──
  const renderDone = () => (
    <div className="text-center py-8 space-y-4">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-accent" />
      </div>
      <h3 className="font-display font-bold text-xl text-foreground">Treino Concluído! 🎉</h3>
      <p className="text-sm text-muted-foreground">
        {selectedWorkout?.name} • {trainingMinutes} min
      </p>
      {(metricsForm.calories_burned || metricsForm.workout_bpm_avg) && (
        <div className="flex justify-center gap-4">
          {metricsForm.workout_bpm_avg && (
            <div className="bg-secondary/30 rounded-xl px-4 py-2">
              <p className="text-lg font-bold text-foreground">{metricsForm.workout_bpm_avg}</p>
              <p className="text-[10px] text-muted-foreground">BPM Médio</p>
            </div>
          )}
          {metricsForm.calories_burned && (
            <div className="bg-secondary/30 rounded-xl px-4 py-2">
              <p className="text-lg font-bold text-foreground">{metricsForm.calories_burned}</p>
              <p className="text-[10px] text-muted-foreground">kcal</p>
            </div>
          )}
        </div>
      )}
      <button onClick={() => { setPhase("workouts"); onOpenChange(false); }}
        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors">
        Fechar
      </button>
    </div>
  );

  // ── WORKOUTS PHASE ──
  const renderWorkouts = () => (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum treino criado nesta jornada</p>
      ) : (
        <div className="space-y-4">
          {/* Workout selector */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {isWeekly ? "Selecione o Treino da Semana" : "Selecione o Treino"}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
              {workouts.map((w, i) => {
                const isSelected = selectedWorkout?.id === w.id;
                return (
                  <button key={w.id} onClick={() => { setSelectedWorkout(w); setShowOrientations(false); setExpandedGroups(new Set()); setExpandedExercise(null); }}
                    className={`shrink-0 rounded-xl p-3 min-w-[100px] text-left transition-all ${isSelected ? "bg-[hsl(250,55%,50%)] text-white shadow-lg shadow-[hsl(250,55%,50%)/0.3]" : "bg-secondary border border-border text-foreground hover:border-primary/30"}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-[hsl(150,60%,45%)]" : "bg-muted-foreground/40"}`} />
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="font-display font-bold text-sm truncate">{w.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Dumbbell className={`w-3 h-3 ${isSelected ? "text-white/70" : "text-muted-foreground"}`} />
                      <span className={`text-[10px] ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>{w.day_label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected workout details */}
          {selectedWorkout && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="font-display font-bold text-lg text-foreground">{selectedWorkout.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{selectedWorkout.day_label}</span>
              </div>
              {selectedWorkout.orientations && (
                <div>
                  <button onClick={() => setShowOrientations(!showOrientations)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="w-3.5 h-3.5" /><span>Orientações</span>
                    {showOrientations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showOrientations && <p className="mt-2 text-sm text-primary/80 bg-primary/5 rounded-lg px-3 py-2">{selectedWorkout.orientations}</p>}
                </div>
              )}
            </div>
          )}

          {/* Exercises - collapsible */}
          {selectedWorkout && hasExercises ? (
            <div className="space-y-3">
              {groups.map((group) => renderGroup(group, false))}
            </div>
          ) : selectedWorkout ? (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
              <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum exercício adicionado a este treino</p>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="space-y-2">
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(220,60%,50%)] text-white font-display font-bold text-sm hover:opacity-90 transition-opacity">
              <Printer className="w-4 h-4" />Imprimir Treino
            </button>
            <button onClick={handleStartWorkout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(150,60%,45%)] text-white font-display font-bold text-sm hover:opacity-90 transition-opacity">
              <Play className="w-4 h-4" />Iniciar Treino
            </button>
          </div>
        </div>
      )}
    </>
  );

  const getHeaderTitle = () => {
    switch (phase) {
      case "checkin": return "Check-in Pré-Treino";
      case "active": return "Treino em Andamento";
      case "checkout": return "Check-out Pós-Treino";
      case "metrics": return "Métricas do Treino";
      case "done": return "Treino Concluído";
      default: return journeyName;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (phase === "active") return; onOpenChange(v); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(220,60%,45%)] to-[hsl(250,55%,50%)] px-4 py-4 text-white flex items-center gap-3 shrink-0">
          <button
            onClick={() => { if (phase === "workouts") onOpenChange(false); else if (phase !== "active") setPhase("workouts"); }}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-base truncate">{getHeaderTitle()}</h2>
            <p className="text-white/60 text-xs">{studentName}</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-4">
            {phase === "workouts" && renderWorkouts()}
            {phase === "checkin" && renderCheckin()}
            {phase === "active" && renderActive()}
            {phase === "checkout" && renderCheckout()}
            {phase === "metrics" && renderMetrics()}
            {phase === "done" && renderDone()}
          </div>
        </ScrollArea>

        {/* Video overlay */}
        {videoUrl && <VideoPlayer url={videoUrl} onClose={() => setVideoUrl(null)} />}
      </DialogContent>
    </Dialog>
  );
};

export default JourneyWorkoutsDialog;
