import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, Plus, Calendar, Heart, Droplets, Moon, Activity,
  Gauge, Thermometer, Brain, Smile, Zap, Eye, ChevronDown, ChevronUp,
  Clock, Flame, TrendingUp, X
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: { id: string; full_name: string; gender?: string | null } | null;
}

// Scale definitions
const PRE_SCALES = [
  {
    key: "fatigue_scale", label: "Fadiga", icon: Zap, min: 1, max: 5,
    labels: { 1: "Sempre Cansado", 2: "Mais Cansado que o normal", 3: "Normal", 4: "Descansado", 5: "Muito descansado" }
  },
  {
    key: "sleep_quality_scale", label: "Qualidade do Sono", icon: Moon, min: 1, max: 5,
    labels: { 1: "Insônia", 2: "Sono inquieto", 3: "Dificuldade de adormecer", 4: "Bom", 5: "Muito Tranquilo" }
  },
  {
    key: "muscle_soreness_scale", label: "Dor Muscular Geral", icon: Activity, min: 1, max: 5,
    labels: { 1: "Muito dolorido", 2: "Aumento de dores musculares", 3: "Normal", 4: "Sentindo-me Bem", 5: "Sentindo-me ótimo(a)" }
  },
  {
    key: "stress_level_scale", label: "Nível de Estresse", icon: Brain, min: 1, max: 5,
    labels: { 1: "Altamente estressado", 2: "Sentindo-me estressado", 3: "Normal", 4: "Relaxado(a)", 5: "Muito Relaxado(a)" }
  },
  {
    key: "mood_scale", label: "Humor", icon: Smile, min: 1, max: 5,
    labels: { 1: "Muito aborrecido(a)", 2: "Menos interessado em atividades que o normal", 3: "Normal", 4: "Bom humor em geral", 5: "Muito bom humor" }
  },
  {
    key: "recovery_perception_scale", label: "Percepção Subjetiva de Recuperação", icon: TrendingUp, min: 0, max: 10,
    labels: { 0: "Nenhuma Recuperação", 1: "Muito Pouco Recuperado", 2: "Pouco Recuperado", 3: "Recuperação Moderada", 4: "Boa Recuperação", 5: "Recuperação muito boa", 6: "Recuperação Avançada", 7: "Recuperação Quase Completa", 8: "Recuperação Estável", 9: "Recuperação Consolidada", 10: "Recuperado" }
  },
  {
    key: "urine_color_scale", label: "Escala de Cor de Urina", icon: Droplets, min: 1, max: 8,
    labels: { 1: "Muito bem hidratado", 2: "Bem hidratado", 3: "Hidratação adequada", 4: "Hidratação aceitável", 5: "Leve desidratação", 6: "Desidratação moderada", 7: "Desidratação significativa", 8: "Desidratação grave / alerta" }
  },
];

const POST_SCALES = [
  {
    key: "post_recovery_scale", label: "Percepção Subjetiva de Recuperação", icon: TrendingUp, min: 0, max: 10,
    labels: { 0: "Nenhuma Recuperação", 1: "Muito Pouco Recuperado", 2: "Pouco Recuperado", 3: "Recuperação Moderada", 4: "Boa Recuperação", 5: "Recuperação Muito Boa", 6: "Recuperação Avançada", 7: "Recuperação Quase Completa", 8: "Recuperação Estável", 9: "Recuperação Consolidada", 10: "Recuperado" }
  },
  {
    key: "perceived_exertion_scale", label: "Percepção Subjetiva de Esforço", icon: Flame, min: 0, max: 10,
    labels: { 0: "Absolutamente nada", 1: "Extremamente fraco", 2: "Muito fraco", 3: "Fraco", 4: "Moderado", 5: "Pouco forte", 6: "Forte", 7: "Muito forte", 8: "Muito forte (pesado)", 9: "Quase máximo", 10: "Máximo" }
  },
  {
    key: "pain_scale_eva", label: "Escala Visual Analógica - EVA", icon: Thermometer, min: 0, max: 10,
    labels: { 0: "Sem dor", 1: "Dor mínima", 2: "Dor leve", 3: "Dor leve a moderada", 4: "Dor moderada", 5: "Dor moderada contínua", 6: "Dor moderada a intensa", 7: "Dor intensa", 8: "Dor muito intensa", 9: "Dor quase insuportável", 10: "Dor insuportável" }
  },
];

const URINE_COLORS = [
  "#F5F5DC", "#FFFACD", "#FFEB3B", "#FFD54F", "#FFB74D", "#FF9800", "#E65100", "#BF360C"
];

function getScaleColor(value: number, max: number, inverted = false) {
  const ratio = value / max;
  const r = inverted ? ratio : 1 - ratio;
  if (r < 0.3) return "hsl(var(--accent))";
  if (r < 0.6) return "hsl(var(--primary))";
  return "hsl(var(--destructive))";
}

// Scale selector component
function ScaleSelector({ scale, value, onChange }: { scale: typeof PRE_SCALES[0]; value: number | null; onChange: (v: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = scale.icon;
  const isUrine = scale.key === "urine_color_scale";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">{scale.label}</p>
          {value !== null && (
            <p className="text-xs text-muted-foreground">
              {value} — {(scale.labels as any)[value]}
            </p>
          )}
        </div>
        {value !== null && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: isUrine ? URINE_COLORS[value - 1] : getScaleColor(value, scale.max, scale.key !== "urine_color_scale" && scale.key !== "pain_scale_eva" && scale.key !== "perceived_exertion_scale"), color: isUrine && value < 4 ? "#333" : "white" }}
          >
            {value}
          </div>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1">
          {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i).map((v) => (
            <button
              key={v}
              onClick={() => { onChange(v); setExpanded(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${value === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50 text-foreground"}`}
            >
              {isUrine && (
                <div className="w-5 h-5 rounded-full border border-border shrink-0" style={{ backgroundColor: URINE_COLORS[v - 1] }} />
              )}
              <span className="font-medium">{v}</span>
              <span className="text-xs opacity-80">{(scale.labels as any)[v]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type View = "main" | "daily-form" | "daily-detail" | "session-detail";

export default function DailyTrackingDialog({ open, onOpenChange, student }: Props) {
  const { user } = useAuth();
  const [view, setView] = useState<View>("main");
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Daily form
  const [dailyForm, setDailyForm] = useState({
    height: "", weight: "", bmi: "", oxygen_saturation: "",
    blood_pressure_systolic: "", blood_pressure_diastolic: "",
    hydration_level: "", sleep_hours: "", resting_bpm: "", notes: ""
  });


  useEffect(() => {
    if (open && student) {
      fetchData();
      setView("main");
    }
  }, [open, student]);

  const fetchData = async () => {
    if (!student) return;
    setLoading(true);
    const [dailyRes, sessionRes] = await Promise.all([
      supabase.from("student_daily_records").select("*").eq("student_id", student.id).order("recorded_at", { ascending: false }).limit(30),
      supabase.from("workout_session_feedback").select("*").eq("student_id", student.id).order("session_date", { ascending: false }).limit(50),
    ]);
    setDailyRecords(dailyRes.data || []);
    setSessionRecords(sessionRes.data || []);
    setLoading(false);
  };

  const saveDailyRecord = async () => {
    if (!student || !user) return;
    const weight = parseFloat(dailyForm.weight);
    const height = parseFloat(dailyForm.height);
    const bmi = weight && height ? parseFloat((weight / ((height / 100) ** 2)).toFixed(1)) : parseFloat(dailyForm.bmi) || null;

    const { error } = await supabase.from("student_daily_records").insert({
      student_id: student.id,
      professor_id: user.id,
      height: height || null,
      weight: weight || null,
      bmi,
      oxygen_saturation: parseFloat(dailyForm.oxygen_saturation) || null,
      blood_pressure_systolic: parseInt(dailyForm.blood_pressure_systolic) || null,
      blood_pressure_diastolic: parseInt(dailyForm.blood_pressure_diastolic) || null,
      hydration_level: dailyForm.hydration_level || null,
      sleep_hours: parseFloat(dailyForm.sleep_hours) || null,
      resting_bpm: parseInt(dailyForm.resting_bpm) || null,
      notes: dailyForm.notes || null,
    } as any);

    if (error) {
      if (error.code === "23505") toast.error("Já existe um registro para hoje");
      else toast.error("Erro ao salvar registro");
    } else {
      toast.success("Registro diário salvo!");
      setDailyForm({ height: "", weight: "", bmi: "", oxygen_saturation: "", blood_pressure_systolic: "", blood_pressure_diastolic: "", hydration_level: "", sleep_hours: "", resting_bpm: "", notes: "" });
      fetchData();
      setView("main");
    }
  };


  // Chart data
  const weightData = dailyRecords.filter(r => r.weight).map(r => ({
    date: format(new Date(r.recorded_at), "dd/MM", { locale: ptBR }),
    peso: Number(r.weight),
    imc: Number(r.bmi),
  })).reverse();

  const preSessionData = sessionRecords.filter(r => r.feedback_type === "pre").map(r => ({
    date: format(new Date(r.session_date), "dd/MM", { locale: ptBR }),
    fadiga: r.fatigue_scale,
    sono: r.sleep_quality_scale,
    dor: r.muscle_soreness_scale,
    estresse: r.stress_level_scale,
    humor: r.mood_scale,
  })).reverse();

  const latestPre = sessionRecords.find(r => r.feedback_type === "pre");
  const latestPost = sessionRecords.find(r => r.feedback_type === "post");
  const latestDaily = dailyRecords[0];

  // Calculate averages from all session records
  const allPre = sessionRecords.filter(r => r.feedback_type === "pre");
  const allPost = sessionRecords.filter(r => r.feedback_type === "post");

  function avg(arr: any[], key: string): number | null {
    const vals = arr.map(r => r[key]).filter((v: any) => v != null && v !== 0) as number[];
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  const avgBpm = avg(allPost, "workout_bpm_avg");
  const avgCalories = avg(allPost, "calories_burned");
  const avgBpmMax = avg(allPost, "workout_bpm_max");

  // Average training duration
  const avgDuration = (() => {
    const durations: number[] = [];
    for (const post of allPost) {
      const pre = allPre.find(p => p.workout_checkin_id === post.workout_checkin_id);
      const checkin = pre?.checkin_time || post.checkin_time;
      const checkout = post.checkout_time;
      if (checkin && checkout) {
        durations.push(Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 60000));
      }
    }
    if (durations.length === 0) return null;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  })();

  const totalSessions = allPost.length || allPre.length;

  const radarData = allPre.length > 0 ? [
    { metric: "Fadiga", value: avg(allPre, "fatigue_scale") || 0, max: 5 },
    { metric: "Sono", value: avg(allPre, "sleep_quality_scale") || 0, max: 5 },
    { metric: "Dor", value: avg(allPre, "muscle_soreness_scale") || 0, max: 5 },
    { metric: "Estresse", value: avg(allPre, "stress_level_scale") || 0, max: 5 },
    { metric: "Humor", value: avg(allPre, "mood_scale") || 0, max: 5 },
    { metric: "Recuperação", value: (avg(allPre, "recovery_perception_scale") || 0) / 2, max: 5 },
  ] : [];

  const postRadarData = allPost.length > 0 ? [
    { metric: "Recuperação", value: avg(allPost, "post_recovery_scale") || 0, max: 10 },
    { metric: "Esforço (PSE)", value: avg(allPost, "perceived_exertion_scale") || 0, max: 10 },
    { metric: "Dor (EVA)", value: avg(allPost, "pain_scale_eva") || 0, max: 10 },
  ] : [];

  const postSessionData = sessionRecords.filter(r => r.feedback_type === "post").map(r => ({
    date: format(new Date(r.session_date), "dd/MM", { locale: ptBR }),
    recuperacao: r.post_recovery_scale,
    esforco: r.perceived_exertion_scale,
    dor: r.pain_scale_eva,
  })).reverse();

  const renderMain = () => (
    <div className="space-y-4">
      {/* Latest daily metrics summary */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          Histórico Diário
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Altura", value: latestDaily?.height ? `${latestDaily.height} cm` : "—", icon: "📏" },
            { label: "Peso", value: latestDaily?.weight ? `${latestDaily.weight} kg` : "—", icon: "⚖️" },
            { label: "IMC", value: latestDaily?.bmi ?? "—", icon: "📊" },
            { label: "Oxigenação", value: latestDaily?.oxygen_saturation ? `${latestDaily.oxygen_saturation}%` : "—", icon: "🫁" },
            { label: "PA", value: latestDaily?.blood_pressure_systolic ? `${latestDaily.blood_pressure_systolic}/${latestDaily.blood_pressure_diastolic}` : "—", icon: "💓" },
            { label: "Hidratação", value: latestDaily?.hydration_level || "—", icon: "💧" },
            { label: "Sono", value: latestDaily?.sleep_hours ? `${latestDaily.sleep_hours}h` : "—", icon: "😴" },
            { label: "BPM", value: latestDaily?.resting_bpm ?? "—", icon: "❤️" },
          ].map((m) => (
            <div key={m.label} className="bg-secondary/30 rounded-lg p-2 text-center">
              <p className="text-lg mb-0.5">{m.icon}</p>
              <p className="text-xs font-bold text-foreground">{m.value}</p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setDailyForm({ height: "", weight: "", bmi: "", oxygen_saturation: "", blood_pressure_systolic: "", blood_pressure_diastolic: "", hydration_level: "", sleep_hours: "", resting_bpm: "", notes: "" }); setView("daily-form"); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Registro Diário
        </button>
      </div>

      {/* Pre/Post workout */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Indicadores de Treino
        </h3>

        {/* Average session indicators */}
        {totalSessions > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground mb-2">Média de {totalSessions} sessão(ões)</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <p className="text-lg">❤️‍🔥</p>
                <p className="text-xs font-bold text-foreground">{avgBpm ?? "—"} bpm</p>
                <p className="text-[9px] text-muted-foreground">BPM Médio</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <p className="text-lg">🔥</p>
                <p className="text-xs font-bold text-foreground">{avgCalories ?? "—"} kcal</p>
                <p className="text-[9px] text-muted-foreground">Calorias</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <p className="text-lg">💓</p>
                <p className="text-xs font-bold text-foreground">{avgBpmMax ?? "—"} bpm</p>
                <p className="text-[9px] text-muted-foreground">BPM Máximo</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <p className="text-lg">⏱️</p>
                <p className="text-xs font-bold text-foreground">{avgDuration ?? "—"} min</p>
                <p className="text-[9px] text-muted-foreground">Tempo de Treino</p>
              </div>
            </div>
          </>
        )}

        {/* Radar chart with averaged pre data */}
        {radarData.length > 0 && (
          <div className="bg-secondary/20 rounded-xl p-3 mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Perfil Pré-Treino (média)</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} outerRadius={60}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                <Radar name="Média" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* Weight evolution chart */}
      {weightData.length > 1 && (
        <div className="bg-secondary/20 rounded-xl p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Evolução do Peso</p>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="peso" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Peso (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pre-workout evolution chart */}
      {preSessionData.length > 1 && (
        <div className="bg-secondary/20 rounded-xl p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Evolução Pré-Treino</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={preSessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="fadiga" stroke="hsl(35, 85%, 50%)" name="Fadiga" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sono" stroke="hsl(220, 60%, 50%)" name="Sono" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="humor" stroke="hsl(150, 55%, 45%)" name="Humor" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="estresse" stroke="hsl(0, 65%, 55%)" name="Estresse" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History list */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Histórico Recente</h3>
        <div className="space-y-2">
          {dailyRecords.slice(0, 5).map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelectedRecord(r); setView("daily-detail"); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(r.recorded_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.weight ? `${r.weight}kg` : ""} {r.bmi ? `• IMC ${r.bmi}` : ""} {r.resting_bpm ? `• ${r.resting_bpm}bpm` : ""}
                </p>
              </div>
            </button>
          ))}
          {sessionRecords.slice(0, 5).map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelectedRecord(r); setView("session-detail"); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent/30 transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.feedback_type === "pre" ? "bg-accent/10" : "bg-destructive/10"}`}>
                {r.feedback_type === "pre" ? <Clock className="w-5 h-5 text-accent" /> : <Flame className="w-5 h-5 text-destructive" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {r.feedback_type === "pre" ? "Pré-Treino" : "Pós-Treino"} — {format(new Date(r.session_date), "dd/MM/yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.feedback_type === "pre" && r.fatigue_scale ? `Fadiga: ${r.fatigue_scale}/5` : ""}
                  {r.feedback_type === "post" && r.perceived_exertion_scale != null ? `Esforço: ${r.perceived_exertion_scale}/10` : ""}
                  {r.calories_burned ? ` • ${r.calories_burned} kcal` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDailyForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "height", label: "Altura (cm)", icon: "📏", type: "number" },
          { key: "weight", label: "Peso (kg)", icon: "⚖️", type: "number" },
          { key: "oxygen_saturation", label: "Oxigenação (%)", icon: "🫁", type: "number" },
          { key: "resting_bpm", label: "BPM Repouso", icon: "❤️", type: "number" },
          { key: "sleep_hours", label: "Horas de Sono", icon: "😴", type: "number" },
        ].map((f) => (
          <div key={f.key}>
            <label className="text-xs text-muted-foreground mb-1 block">{f.icon} {f.label}</label>
            <input
              type={f.type}
              value={(dailyForm as any)[f.key]}
              onChange={(e) => setDailyForm({ ...dailyForm, [f.key]: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">💓 Pressão Arterial</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Sistólica"
            value={dailyForm.blood_pressure_systolic}
            onChange={(e) => setDailyForm({ ...dailyForm, blood_pressure_systolic: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
          />
          <span className="text-muted-foreground">/</span>
          <input
            type="number"
            placeholder="Diastólica"
            value={dailyForm.blood_pressure_diastolic}
            onChange={(e) => setDailyForm({ ...dailyForm, blood_pressure_diastolic: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">mmHg</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">💧 Hidratação</label>
        <select
          value={dailyForm.hydration_level}
          onChange={(e) => setDailyForm({ ...dailyForm, hydration_level: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
        >
          <option value="">Selecionar</option>
          <option value="Baixa">Baixa</option>
          <option value="Normal">Normal</option>
          <option value="Boa">Boa</option>
          <option value="Excelente">Excelente</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">📝 Observações</label>
        <textarea
          value={dailyForm.notes}
          onChange={(e) => setDailyForm({ ...dailyForm, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none"
        />
      </div>

      <button onClick={saveDailyRecord} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
        Salvar Registro Diário
      </button>
    </div>
  );


  const renderDailyDetail = () => {
    if (!selectedRecord) return null;
    const r = selectedRecord;
    const metrics = [
      { label: "Altura", value: r.height ? `${r.height} cm` : "—" },
      { label: "Peso", value: r.weight ? `${r.weight} kg` : "—" },
      { label: "IMC", value: r.bmi ?? "—" },
      { label: "Oxigenação", value: r.oxygen_saturation ? `${r.oxygen_saturation}%` : "—" },
      { label: "Pressão Arterial", value: r.blood_pressure_systolic ? `${r.blood_pressure_systolic}/${r.blood_pressure_diastolic} mmHg` : "—" },
      { label: "Hidratação", value: r.hydration_level || "—" },
      { label: "Sono", value: r.sleep_hours ? `${r.sleep_hours}h` : "—" },
      { label: "BPM Repouso", value: r.resting_bpm ?? "—" },
    ];
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          {format(new Date(r.recorded_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-secondary/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
              <p className="text-lg font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
        {r.notes && (
          <div className="bg-secondary/30 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Observações</p>
            <p className="text-sm text-foreground">{r.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSessionDetail = () => {
    if (!selectedRecord) return null;
    const r = selectedRecord;
    const isPre = r.feedback_type === "pre";
    const scales = isPre ? PRE_SCALES : POST_SCALES;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isPre ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>
            {isPre ? "PRÉ-TREINO" : "PÓS-TREINO"}
          </div>
          <span className="text-sm text-muted-foreground">
            {format(new Date(r.session_date), "dd/MM/yyyy")}
          </span>
        </div>

        {scales.map((scale) => {
          const val = r[scale.key];
          if (val == null) return null;
          const isUrine = scale.key === "urine_color_scale";
          return (
            <div key={scale.key} className="bg-secondary/30 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">{scale.label}</p>
                <div className="flex items-center gap-2">
                  {isUrine && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: URINE_COLORS[val - 1] }} />}
                  <span className="text-lg font-bold text-foreground">{val}</span>
                  <span className="text-xs text-muted-foreground">/ {scale.max}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{(scale.labels as any)[val]}</p>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-border mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(val / scale.max) * 100}%`,
                    backgroundColor: isUrine ? URINE_COLORS[val - 1] : "hsl(var(--primary))"
                  }}
                />
              </div>
            </div>
          );
        })}

        {!isPre && (r.workout_bpm_avg || r.calories_burned) && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground">BPM Médio</p>
              <p className="text-lg font-bold text-foreground">{r.workout_bpm_avg ?? "—"}</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground">BPM Máx</p>
              <p className="text-lg font-bold text-foreground">{r.workout_bpm_max ?? "—"}</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Calorias</p>
              <p className="text-lg font-bold text-foreground">{r.calories_burned ?? "—"}</p>
            </div>
          </div>
        )}

        {r.checkin_time && r.checkout_time && (
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Tempo de Treino</p>
            <p className="text-lg font-bold text-foreground">
              {Math.round((new Date(r.checkout_time).getTime() - new Date(r.checkin_time).getTime()) / 60000)} min
            </p>
          </div>
        )}
      </div>
    );
  };

  const getTitle = () => {
    switch (view) {
      case "daily-form": return "Novo Registro Diário";
      case "daily-detail": return "Registro Diário";
      case "session-detail": return "Feedback de Sessão";
      default: return `Detalhes — ${student?.full_name}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[90vh] max-h-[90vh] min-h-0 flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {view !== "main" && (
              <button onClick={() => setView("main")} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
            )}
            <DialogTitle className="font-display text-base">{getTitle()}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <div className="pb-28">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {view === "main" && renderMain()}
                {view === "daily-form" && renderDailyForm()}
                {view === "daily-detail" && renderDailyDetail()}
                {view === "session-detail" && renderSessionDetail()}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
