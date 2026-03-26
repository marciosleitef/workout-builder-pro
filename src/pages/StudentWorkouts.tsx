import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentBottomNav from "@/components/StudentBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dumbbell, Check, Play, ChevronDown, ChevronUp, Clock, Info,
  ArrowLeft, CalendarDays, Activity, Zap, Moon, Brain, Smile,
  TrendingUp, Droplets, Thermometer, Flame, Square, CheckCircle2,
  Link2, Video, Eye, Hash, RotateCw, Timer, Gauge, Ruler, Wind,
  MessageSquare
} from "lucide-react";

// ── Types ──
interface WorkoutExerciseData {
  id: string;
  exercise: { name: string; pilar?: string; classe?: string; videoUrl?: string; image_url?: string };
  sets?: string; reps?: string; load?: string; rest?: string;
  speed?: string; distance?: string; duration?: string;
  breathing?: string; calories?: string; notes?: string;
}
interface BiSetData { id: string; type: "biset"; exercises: WorkoutExerciseData[]; }
interface ExerciseGroupData { id: string; name: string; color: string; items: (WorkoutExerciseData | BiSetData)[]; }
interface Workout {
  id: string; name: string; day_label: string; orientations: string | null;
  sort_order: number | null; exercises_data: ExerciseGroupData[] | null;
}

// ── Scales ──
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

function getScaleColor(value: number, max: number) {
  const ratio = 1 - value / max;
  if (ratio < 0.3) return "hsl(var(--accent))";
  if (ratio < 0.6) return "hsl(var(--primary))";
  return "hsl(var(--destructive))";
}

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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all hover:bg-primary/10 border border-border bg-card">
            {isUrine ? (
              <div className="w-7 h-7 rounded-full border border-border shrink-0" style={{ backgroundColor: URINE_COLORS[v - 1] }} />
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

function VideoPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <video src={url} controls autoPlay className="w-full rounded-xl" />
        <button onClick={onClose} className="mt-3 w-full py-2 rounded-xl bg-primary-foreground/10 text-primary-foreground text-sm font-bold">Fechar</button>
      </div>
    </div>
  );
}

type Phase = "journeys" | "workouts" | "checkin" | "active" | "checkout" | "metrics" | "done";
const isBiSetData = (item: WorkoutExerciseData | BiSetData): item is BiSetData => "type" in item && item.type === "biset";

const StudentWorkouts = () => {
  const { user, studentId } = useAuth();
  const [phase, setPhase] = useState<Phase>("journeys");

  // Data
  const [journeys, setJourneys] = useState<any[]>([]);
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [student, setStudent] = useState<any>(null);

  // Execution state
  const [currentStep, setCurrentStep] = useState(0);
  const [checkinForm, setCheckinForm] = useState<Record<string, any>>({});
  const [checkoutForm, setCheckoutForm] = useState<Record<string, any>>({});
  const [metricsForm, setMetricsForm] = useState({ workout_bpm_avg: "", workout_bpm_max: "", calories_burned: "" });
  const [feedbackText, setFeedbackText] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showOrientations, setShowOrientations] = useState(false);

  // Editable exercise params (student can override during workout)
  const [exerciseOverrides, setExerciseOverrides] = useState<Record<string, Record<string, string>>>({});

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!studentId) return;
    fetchJourneys();
    fetchStudent();
  }, [studentId]);

  useEffect(() => {
    if (phase === "active" && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase, startTime]);

  const fetchStudent = async () => {
    const { data } = await supabase.from("students").select("*").eq("id", studentId!).single();
    setStudent(data);
  };

  const fetchJourneys = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("workout_journeys").select("*")
      .eq("student_id", studentId!).eq("status", "active")
      .lte("start_date", today).gte("end_date", today)
      .order("created_at", { ascending: false });
    setJourneys(data || []);
  };

  const fetchWorkouts = async (journeyId: string) => {
    const { data } = await supabase.from("workouts").select("id, name, day_label, orientations, sort_order, exercises_data")
      .eq("journey_id", journeyId).order("sort_order", { ascending: true });
    const mapped = (data || []).map((w: any) => ({ ...w, exercises_data: (w.exercises_data as unknown as ExerciseGroupData[]) || [] }));
    setWorkouts(mapped);
    if (mapped.length > 0) setSelectedWorkout(mapped[0]);
  };

  const selectJourney = (j: any) => {
    setActiveJourney(j);
    fetchWorkouts(j.id);
    setPhase("workouts");
  };

  const handleStartWorkout = () => {
    if (!selectedWorkout) return;
    setCheckinForm({});
    setCurrentStep(0);
    // Initialize overrides from existing exercise data
    const overrides: Record<string, Record<string, string>> = {};
    const groups = selectedWorkout.exercises_data || [];
    groups.forEach(g => {
      g.items.forEach(item => {
        if (isBiSetData(item)) {
          item.exercises.forEach(ex => {
            const exOverride: Record<string, string> = {};
            PARAM_FIELDS.forEach(f => { if ((ex as any)[f.key]) exOverride[f.key] = (ex as any)[f.key]; });
            if (Object.keys(exOverride).length > 0) overrides[ex.id] = exOverride;
          });
        } else {
          const exOverride: Record<string, string> = {};
          PARAM_FIELDS.forEach(f => { if ((item as any)[f.key]) exOverride[f.key] = (item as any)[f.key]; });
          if (Object.keys(exOverride).length > 0) overrides[item.id] = exOverride;
        }
      });
    });
    setExerciseOverrides(overrides);
    setPhase("checkin");
  };

  const handleSubmitCheckin = async () => {
    if (!user || !studentId || !selectedWorkout || !activeJourney) return;
    setSaving(true);
    await supabase.from("workout_session_feedback").insert({
      student_id: studentId, professor_id: activeJourney.professor_id,
      feedback_type: "pre", session_date: new Date().toISOString().split("T")[0],
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
      student_id: studentId, professor_id: activeJourney.professor_id,
      journey_id: activeJourney.id, workout_id: selectedWorkout.id, checked_in_by: user.id,
    });
    setSaving(false);
    setStartTime(new Date());
    setCompletedExercises(new Set());
    toast.success("Check-in registrado! Bom treino! 💪");
    setPhase("active");
  };

  const handleFinishWorkout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCheckoutForm({});
    setCurrentStep(0);
    setPhase("checkout");
  };

  const handleSubmitCheckout = () => setPhase("metrics");

  const handleSubmitMetrics = async () => {
    if (!user || !studentId || !activeJourney || !student) return;
    setSaving(true);
    await supabase.from("workout_session_feedback").insert({
      student_id: studentId, professor_id: activeJourney.professor_id,
      feedback_type: "post", session_date: new Date().toISOString().split("T")[0],
      checkout_time: new Date().toISOString(),
      checkin_time: startTime?.toISOString() || null,
      post_recovery_scale: checkoutForm.post_recovery_scale || null,
      perceived_exertion_scale: checkoutForm.perceived_exertion_scale || null,
      pain_scale_eva: checkoutForm.pain_scale_eva || null,
      workout_bpm_avg: parseInt(metricsForm.workout_bpm_avg) || null,
      workout_bpm_max: parseInt(metricsForm.workout_bpm_max) || null,
      calories_burned: parseInt(metricsForm.calories_burned) || null,
    } as any);

    // Send notification to professor with feedback
    const trainingMin = startTime ? Math.round((Date.now() - startTime.getTime()) / 60000) : 0;
    let notifBody = `${student.full_name} concluiu o treino "${selectedWorkout?.name}" (${trainingMin} min).`;
    if (metricsForm.calories_burned) notifBody += ` ${metricsForm.calories_burned} kcal.`;
    if (feedbackText.trim()) notifBody += `\n\n💬 Feedback: "${feedbackText.trim()}"`;

    await supabase.from("notifications").insert({
      user_id: activeJourney.professor_id,
      title: `🏋️ Treino concluído — ${student.full_name}`,
      body: notifBody,
      type: "workout_completed",
    });

    setSaving(false);
    toast.success("Treino finalizado! Dados registrados ✅");
    setPhase("done");
  };

  const toggleExerciseComplete = (exId: string) => {
    setCompletedExercises(prev => {
      const next = new Set(prev);
      next.has(exId) ? next.delete(exId) : next.add(exId);
      return next;
    });
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const updateExerciseParam = (exId: string, field: string, value: string) => {
    setExerciseOverrides(prev => ({
      ...prev,
      [exId]: { ...(prev[exId] || {}), [field]: value },
    }));
  };

  const getExParam = (ex: WorkoutExerciseData, field: string) => {
    return exerciseOverrides[ex.id]?.[field] ?? (ex as any)[field] ?? "";
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const groups = selectedWorkout?.exercises_data || [];
  const hasExercises = groups.some(g => g.items.length > 0);
  const totalExCount = groups.reduce((acc, g) => acc + g.items.reduce((a, item) => a + (isBiSetData(item) ? item.exercises.length : 1), 0), 0);
  const completedCount = completedExercises.size;

  // ── Exercise item (active = editable params) ──
  const renderExerciseItem = (ex: WorkoutExerciseData, isActive: boolean) => {
    const isCompleted = completedExercises.has(ex.id);
    const isExpanded = expandedExercise === ex.id;
    const hasParams = PARAM_FIELDS.some(f => getExParam(ex, f.key));
    const hasVideo = !!ex.exercise.videoUrl;

    return (
      <div key={ex.id} className={`transition-colors ${isCompleted && isActive ? "bg-accent/5" : ""}`}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          {isActive && (
            <button onClick={() => toggleExerciseComplete(ex.id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isCompleted ? "bg-accent border-accent" : "border-muted-foreground/40 hover:border-primary"}`}>
              {isCompleted && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
            </button>
          )}
          <Dumbbell className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <button onClick={() => setExpandedExercise(isExpanded ? null : ex.id)} className="flex-1 min-w-0 text-left">
            <p className={`text-sm truncate ${isCompleted && isActive ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {ex.exercise.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {[getExParam(ex, "sets") && `${getExParam(ex, "sets")}x`, getExParam(ex, "reps") && `${getExParam(ex, "reps")} reps`,
                getExParam(ex, "load") && `${getExParam(ex, "load")}kg`, getExParam(ex, "rest") && `${getExParam(ex, "rest")}s desc`
              ].filter(Boolean).join(" • ")}
            </p>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {hasVideo && (
              <button onClick={() => setVideoUrl(ex.exercise.videoUrl!)}
                className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"><Video className="w-3.5 h-3.5 text-primary" /></button>
            )}
            <button onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
              className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-3 pt-0">
            {isActive ? (
              // Editable params during active workout
              <div className="grid grid-cols-2 gap-2">
                {PARAM_FIELDS.map(f => {
                  const Icon = f.icon;
                  const val = getExParam(ex, f.key);
                  if (!isActive && !val) return null;
                  return (
                    <div key={f.key}>
                      <label className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground uppercase mb-0.5">
                        <Icon className="w-3 h-3" /> {f.label}
                      </label>
                      <input
                        value={val}
                        onChange={e => updateExerciseParam(ex.id, f.key, e.target.value)}
                        placeholder="—"
                        className="w-full px-2 py-1.5 text-xs bg-secondary/60 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              // Read-only params
              <div className="grid grid-cols-3 gap-2">
                {PARAM_FIELDS.filter(f => (ex as any)[f.key]).map(f => {
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
            )}
            {ex.notes && (
              <div className="mt-2 bg-secondary/50 rounded-lg px-2 py-1.5">
                <p className="text-[9px] text-muted-foreground">Observações do professor</p>
                <p className="text-xs text-foreground">{ex.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Group rendering ──
  const renderGroup = (group: ExerciseGroupData, isActive: boolean) => {
    const isOpen = expandedGroups.has(group.id);
    const groupExCount = group.items.reduce((a, item) => a + (isBiSetData(item) ? item.exercises.length : 1), 0);
    const groupCompleted = group.items.reduce((a, item) => {
      if (isBiSetData(item)) return a + item.exercises.filter(e => completedExercises.has(e.id)).length;
      return a + (completedExercises.has(item.id) ? 1 : 0);
    }, 0);

    return (
      <div key={group.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: group.color, borderColor: group.color.replace("0.15", "0.4") }}>
        <button onClick={() => toggleGroupExpanded(group.id)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/5 transition-colors">
          <div className="flex items-center gap-2">
            <p className="text-xs font-display font-bold text-foreground uppercase tracking-wide">{group.name}</p>
            {isActive && <span className="text-[10px] text-muted-foreground font-medium">{groupCompleted}/{groupExCount}</span>}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {isOpen && (
          <div className="bg-background/60 divide-y divide-border/50">
            {group.items.map(item =>
              isBiSetData(item) ? (
                <div key={item.id} className="border-l-2 border-primary/50">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5">
                    <Link2 className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-display font-semibold text-primary">Bi-Set</span>
                  </div>
                  {item.exercises.map(ex => renderExerciseItem(ex, isActive))}
                </div>
              ) : renderExerciseItem(item, isActive)
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════
  // ── PHASE RENDERS ──
  // ══════════════════════════════════

  const renderJourneys = () => (
    <div className="space-y-3">
      {journeys.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma jornada ativa no momento</p>
          <p className="text-xs text-muted-foreground mt-1">Aguarde seu professor criar uma jornada</p>
        </div>
      ) : (
        journeys.map(j => (
          <button key={j.id} onClick={() => selectJourney(j)}
            className="w-full rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-foreground truncate">{j.name}</p>
                <p className="text-xs text-muted-foreground">
                  {j.objective && `${j.objective} • `}{j.level && `${j.level} • `}{j.format}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(j.start_date).toLocaleDateString("pt-BR")} — {new Date(j.end_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
            </div>
          </button>
        ))
      )}
    </div>
  );

  const renderWorkoutsList = () => (
    <div className="space-y-4">
      {/* Workout selector */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Selecione o Treino</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {workouts.map((w, i) => {
            const isSelected = selectedWorkout?.id === w.id;
            return (
              <button key={w.id} onClick={() => { setSelectedWorkout(w); setExpandedGroups(new Set()); setExpandedExercise(null); }}
                className={`shrink-0 rounded-xl p-3 min-w-[100px] text-left transition-all ${isSelected ? "bg-foreground text-background shadow-lg" : "bg-secondary border border-border text-foreground hover:border-primary/30"}`}>
                <div className="flex items-center gap-1 mb-1">
                  <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-muted-foreground/40"}`} />
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <p className="font-display font-bold text-sm truncate">{w.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Dumbbell className={`w-3 h-3 ${isSelected ? "text-primary-foreground/50" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] ${isSelected ? "text-primary-foreground/50" : "text-muted-foreground"}`}>{w.day_label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedWorkout && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-display font-bold text-lg text-foreground">{selectedWorkout.name}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{selectedWorkout.day_label}</span>
          </div>
          {selectedWorkout.orientations && (
            <div>
              <button onClick={() => setShowOrientations(!showOrientations)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Info className="w-3.5 h-3.5" /><span>Orientações</span>
                {showOrientations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showOrientations && <p className="mt-2 text-sm text-primary/80 bg-primary/5 rounded-lg px-3 py-2">{selectedWorkout.orientations}</p>}
            </div>
          )}
        </div>
      )}

      {selectedWorkout && hasExercises && (
        <div className="space-y-3">
          {groups.map(group => renderGroup(group, false))}
        </div>
      )}

      <Button className="w-full" size="lg" onClick={handleStartWorkout}>
        <Play className="w-4 h-4 mr-2" /> Iniciar Treino
      </Button>
    </div>
  );

  const renderCheckin = () => {
    const totalSteps = PRE_SCALES.length;
    const progress = (currentStep / totalSteps) * 100;
    if (currentStep >= totalSteps) {
      return (
        <div className="space-y-4">
          <div className="bg-foreground rounded-xl p-4 text-primary-foreground text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-display font-bold">Check-in Completo!</h3>
          </div>
          <div className="space-y-2">
            {PRE_SCALES.map(s => (
              <div key={s.key} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                <span className="text-sm text-foreground">{s.label}</span>
                <span className="text-sm font-bold text-primary">{checkinForm[s.key]} — {(s.labels as any)[checkinForm[s.key]]}</span>
              </div>
            ))}
          </div>
          <Button className="w-full" size="lg" onClick={handleSubmitCheckin} disabled={saving}>
            {saving ? "Salvando..." : "Confirmar Check-in e Iniciar Treino"}
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pergunta {currentStep + 1} de {totalSteps}</span><span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <StepScaleQuestion scale={PRE_SCALES[currentStep]} onSelect={v => { setCheckinForm({ ...checkinForm, [PRE_SCALES[currentStep].key]: v }); setCurrentStep(currentStep + 1); }} />
      </div>
    );
  };

  const renderActive = () => (
    <div className="space-y-4">
      <div className="bg-foreground rounded-xl p-4 text-primary-foreground text-center">
        <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
        <h3 className="font-display font-bold text-lg">Treino em Andamento</h3>
        <p className="text-primary-foreground/60 text-sm">{selectedWorkout?.name}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="bg-primary-foreground/5 rounded-lg px-4 py-2">
            <p className="text-2xl font-display font-bold font-mono">{formatTime(elapsedSeconds)}</p>
            <p className="text-primary-foreground/40 text-[10px]">tempo</p>
          </div>
          <div className="bg-primary-foreground/5 rounded-lg px-4 py-2">
            <p className="text-2xl font-display font-bold">{completedCount}/{totalExCount}</p>
            <p className="text-primary-foreground/40 text-[10px]">exercícios</p>
          </div>
        </div>
      </div>
      {hasExercises && <div className="space-y-3">{groups.map(g => renderGroup(g, true))}</div>}
      <Button variant="destructive" className="w-full" size="lg" onClick={handleFinishWorkout}>
        <Square className="w-4 h-4 mr-2" /> Finalizar Treino
      </Button>
    </div>
  );

  const renderCheckout = () => {
    const totalSteps = POST_SCALES.length;
    const progress = (currentStep / totalSteps) * 100;
    if (currentStep >= totalSteps) {
      return (
        <div className="space-y-4">
          <div className="bg-destructive rounded-xl p-4 text-destructive-foreground text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-display font-bold">Check-out Completo!</h3>
          </div>
          <div className="space-y-2">
            {POST_SCALES.map(s => (
              <div key={s.key} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                <span className="text-sm text-foreground">{s.label}</span>
                <span className="text-sm font-bold text-primary">{checkoutForm[s.key]} — {(s.labels as any)[checkoutForm[s.key]]}</span>
              </div>
            ))}
          </div>
          <Button variant="destructive" className="w-full" size="lg" onClick={handleSubmitCheckout}>Confirmar Check-out</Button>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pergunta {currentStep + 1} de {totalSteps}</span><span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-destructive rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <StepScaleQuestion scale={POST_SCALES[currentStep]} onSelect={v => { setCheckoutForm({ ...checkoutForm, [POST_SCALES[currentStep].key]: v }); setCurrentStep(currentStep + 1); }} />
      </div>
    );
  };

  const renderMetrics = () => (
    <div className="space-y-4">
      <div className="bg-foreground/90 rounded-xl p-4 text-primary-foreground">
        <div className="flex items-center gap-2 mb-1"><Activity className="w-5 h-5" /><h3 className="font-display font-bold">Métricas do Treino</h3></div>
        <p className="text-primary-foreground/60 text-xs">Informe os dados do treino</p>
      </div>
      <div className="space-y-3">
        {[
          { key: "workout_bpm_avg", label: "BPM Médio", icon: "❤️", placeholder: "Ex: 135" },
          { key: "workout_bpm_max", label: "BPM Máximo", icon: "💓", placeholder: "Ex: 175" },
          { key: "calories_burned", label: "Calorias Gastas", icon: "🔥", placeholder: "Ex: 450" },
        ].map(f => (
          <div key={f.key}>
            <label className="text-sm font-medium text-foreground flex items-center gap-1"><span>{f.icon}</span> {f.label}</label>
            <Input type="number" placeholder={f.placeholder} value={(metricsForm as any)[f.key]}
              onChange={e => setMetricsForm({ ...metricsForm, [f.key]: e.target.value })} className="mt-1" />
          </div>
        ))}
      </div>

      {/* Feedback for professor */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium text-foreground">Feedback para o professor</label>
        </div>
        <textarea
          value={feedbackText}
          onChange={e => setFeedbackText(e.target.value)}
          placeholder="Como foi o treino? Alguma observação, dificuldade ou ajuste necessário..."
          rows={3}
          className="w-full px-3 py-2 text-sm bg-secondary/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
        <p className="text-[10px] text-muted-foreground">Seu professor receberá este feedback como notificação</p>
      </div>

      <Button className="w-full" size="lg" onClick={handleSubmitMetrics} disabled={saving}>
        {saving ? "Salvando..." : "Finalizar e Salvar"}
      </Button>
    </div>
  );

  const trainingMinutes = startTime ? Math.round(elapsedSeconds / 60) : 0;

  const renderDone = () => (
    <div className="text-center py-8 space-y-4">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-accent" />
      </div>
      <h3 className="font-display font-bold text-xl text-foreground">Treino Concluído! 🎉</h3>
      <p className="text-sm text-muted-foreground">{selectedWorkout?.name} • {trainingMinutes} min</p>
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
      <Button onClick={() => { setPhase("journeys"); setSelectedWorkout(null); setActiveJourney(null); }}>
        Voltar aos Treinos
      </Button>
    </div>
  );

  // ── Header logic ──
  const getHeaderTitle = () => {
    switch (phase) {
      case "journeys": return "Meus Treinos";
      case "workouts": return activeJourney?.name || "Treinos";
      case "checkin": return "Check-in Pré-Treino";
      case "active": return "Treino em Andamento";
      case "checkout": return "Check-out Pós-Treino";
      case "metrics": return "Métricas do Treino";
      case "done": return "Treino Concluído";
    }
  };

  const handleBack = () => {
    if (phase === "journeys") return;
    if (phase === "active") return; // Can't go back during active
    if (phase === "checkin" && currentStep > 0) { setCurrentStep(currentStep - 1); return; }
    if (phase === "checkout" && currentStep > 0) { setCurrentStep(currentStep - 1); return; }
    if (phase === "workouts") { setPhase("journeys"); return; }
    if (phase === "checkin") { setPhase("workouts"); return; }
    setPhase("workouts");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {phase !== "journeys" && phase !== "active" && (
            <button onClick={handleBack} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <h1 className="text-lg font-bold font-display">{getHeaderTitle()}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {phase === "journeys" && renderJourneys()}
        {phase === "workouts" && renderWorkoutsList()}
        {phase === "checkin" && renderCheckin()}
        {phase === "active" && renderActive()}
        {phase === "checkout" && renderCheckout()}
        {phase === "metrics" && renderMetrics()}
        {phase === "done" && renderDone()}
      </div>

      {videoUrl && <VideoPlayer url={videoUrl} onClose={() => setVideoUrl(null)} />}
      {phase !== "active" && phase !== "checkin" && phase !== "checkout" && phase !== "metrics" && <StudentBottomNav />}
    </div>
  );
};

export default StudentWorkouts;
