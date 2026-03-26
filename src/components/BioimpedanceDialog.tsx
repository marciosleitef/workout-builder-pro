import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Upload, TrendingUp, ArrowLeft, BarChart3, Scale, Percent, Activity, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

interface BioRecord {
  id: string;
  measured_at: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  age: number | null;
  fat_mass: number | null;
  body_fat_pct: number | null;
  total_body_water: number | null;
  water_lean_mass_pct: number | null;
  hydration_index: number | null;
  water_lean_mass_abs_pct: number | null;
  intracellular_water: number | null;
  intracellular_water_pct: number | null;
  extracellular_water: number | null;
  lean_mass: number | null;
  lean_mass_pct: number | null;
  muscle_fat_ratio: number | null;
  muscle_mass: number | null;
  muscle_mass_pct: number | null;
  basal_metabolism: number | null;
  phase_angle: number | null;
  cellular_age: number | null;
  body_water_pct: number | null;
  bone_mass: number | null;
  visceral_fat: number | null;
  file_url: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

const FIELD_LABELS: { key: keyof BioRecord; label: string; unit: string }[] = [
  { key: "weight", label: "Peso", unit: "kg" },
  { key: "height", label: "Altura", unit: "cm" },
  { key: "bmi", label: "IMC", unit: "" },
  { key: "age", label: "Idade", unit: "anos" },
  { key: "fat_mass", label: "Massa Gorda", unit: "kg" },
  { key: "body_fat_pct", label: "% Gordura", unit: "%" },
  { key: "total_body_water", label: "Água Corporal Total", unit: "L" },
  { key: "water_lean_mass_pct", label: "Água Corpo/Massa Magra", unit: "%" },
  { key: "hydration_index", label: "Índice Hidratação", unit: "" },
  { key: "water_lean_mass_abs_pct", label: "Água Massa Magra", unit: "%" },
  { key: "intracellular_water", label: "Água Intracelular", unit: "L" },
  { key: "intracellular_water_pct", label: "% Água Intracelular", unit: "%" },
  { key: "extracellular_water", label: "Água Extracelular", unit: "L" },
  { key: "lean_mass", label: "Massa Magra", unit: "kg" },
  { key: "lean_mass_pct", label: "% Massa Magra", unit: "%" },
  { key: "muscle_fat_ratio", label: "Razão Músculo/Gordura", unit: "" },
  { key: "muscle_mass", label: "Massa Muscular", unit: "kg" },
  { key: "muscle_mass_pct", label: "% Massa Muscular", unit: "%" },
  { key: "basal_metabolism", label: "Taxa Metabol. Basal", unit: "kcal" },
  { key: "phase_angle", label: "Ângulo de Fase", unit: "°" },
  { key: "cellular_age", label: "Idade Celular", unit: "anos" },
  { key: "visceral_fat", label: "Gordura Visceral", unit: "" },
  { key: "bone_mass", label: "Massa Óssea", unit: "kg" },
];

const NUMERIC_KEYS = FIELD_LABELS.map(f => f.key);

type View = "main" | "form" | "detail" | "compare";

/* ── Realistic Human Body SVG ── */
const HumanBody = ({ record, size = "md" }: { record: BioRecord; size?: "sm" | "md" }) => {
  const fatPct = record.body_fat_pct ?? 25;
  const musclePct = record.muscle_mass_pct ?? 30;
  const leanPct = record.lean_mass_pct ?? 65;

  // Body width scales with fat percentage (thinner = lower fat)
  const bodyScale = 0.85 + (fatPct / 100) * 0.4; // 0.85 to 1.25
  const w = size === "sm" ? "w-20" : "w-28";
  const h = size === "sm" ? "h-48" : "h-64";

  // Colors: skin base with overlays for fat/muscle
  const skinBase = "hsl(25, 40%, 75%)";
  const fatOverlay = fatPct > 30 ? "hsl(0, 55%, 60%)" : fatPct > 22 ? "hsl(35, 65%, 58%)" : "hsl(140, 45%, 50%)";
  const muscleOverlay = musclePct > 35 ? "hsl(140, 55%, 42%)" : musclePct > 25 ? "hsl(170, 45%, 48%)" : "hsl(200, 40%, 55%)";
  const fatOpacity = 0.3 + (fatPct / 100) * 0.5;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 420" className={`${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`skin-${record.id}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="hsl(25, 45%, 80%)" />
            <stop offset="100%" stopColor={skinBase} />
          </radialGradient>
          <radialGradient id={`torso-${record.id}`} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={fatOverlay} stopOpacity={fatOpacity * 0.6} />
            <stop offset="100%" stopColor={fatOverlay} stopOpacity={fatOpacity} />
          </radialGradient>
          <linearGradient id={`muscle-${record.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={muscleOverlay} stopOpacity="0.4" />
            <stop offset="100%" stopColor={muscleOverlay} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        <g transform={`translate(${100 - 100 * bodyScale}, 0) scale(${bodyScale}, 1)`}>
          {/* Head */}
          <ellipse cx="100" cy="38" rx="26" ry="30" fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.8" />
          {/* Ears */}
          <ellipse cx="74" cy="38" rx="5" ry="8" fill={skinBase} stroke="hsl(25, 30%, 60%)" strokeWidth="0.5" />
          <ellipse cx="126" cy="38" rx="5" ry="8" fill={skinBase} stroke="hsl(25, 30%, 60%)" strokeWidth="0.5" />

          {/* Neck */}
          <path d="M88 65 Q88 60 88 58 L112 58 Q112 60 112 65 L115 78 L85 78 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.5" />

          {/* Shoulders + Torso */}
          <path d="M85 78 Q60 80 48 90 L40 100 L38 130
                   Q36 160 42 180 L48 195
                   Q55 210 70 215 L80 218 Q90 220 100 220
                   Q110 220 120 218 L130 215 Q145 210 152 195
                   L158 180 Q164 160 162 130
                   L160 100 L152 90 Q140 80 115 78 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.8" />
          {/* Fat overlay on torso */}
          <path d="M85 78 Q60 80 48 90 L40 100 L38 130
                   Q36 160 42 180 L48 195
                   Q55 210 70 215 L80 218 Q90 220 100 220
                   Q110 220 120 218 L130 215 Q145 210 152 195
                   L158 180 Q164 160 162 130
                   L160 100 L152 90 Q140 80 115 78 Z"
            fill={`url(#torso-${record.id})`} />

          {/* Chest definition lines */}
          <path d="M72 110 Q85 118 100 115 Q115 118 128 110" fill="none" stroke="hsl(25, 30%, 60%)" strokeWidth="0.4" opacity="0.5" />
          {/* Abs line */}
          <line x1="100" y1="130" x2="100" y2="200" stroke="hsl(25, 30%, 60%)" strokeWidth="0.3" opacity="0.3" />

          {/* Left Arm */}
          <path d="M48 90 Q38 92 32 100
                   L22 140 Q18 155 20 165 L22 175
                   Q24 180 28 180 L34 178
                   Q38 176 38 170 L40 140
                   Q42 120 40 100 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.6" />
          <path d="M48 90 Q38 92 32 100 L22 140 Q18 155 20 165 L22 175 Q24 180 28 180 L34 178 Q38 176 38 170 L40 140 Q42 120 40 100 Z"
            fill={`url(#muscle-${record.id})`} />
          {/* Left Hand */}
          <ellipse cx="26" cy="185" rx="8" ry="10" fill={skinBase} stroke="hsl(25, 30%, 60%)" strokeWidth="0.4" />

          {/* Right Arm */}
          <path d="M152 90 Q162 92 168 100
                   L178 140 Q182 155 180 165 L178 175
                   Q176 180 172 180 L166 178
                   Q162 176 162 170 L160 140
                   Q158 120 160 100 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.6" />
          <path d="M152 90 Q162 92 168 100 L178 140 Q182 155 180 165 L178 175 Q176 180 172 180 L166 178 Q162 176 162 170 L160 140 Q158 120 160 100 Z"
            fill={`url(#muscle-${record.id})`} />
          {/* Right Hand */}
          <ellipse cx="174" cy="185" rx="8" ry="10" fill={skinBase} stroke="hsl(25, 30%, 60%)" strokeWidth="0.4" />

          {/* Hips / Pelvis */}
          <path d="M70 215 Q65 225 60 240
                   L58 250 Q60 255 70 255
                   L100 258 L130 255 Q140 255 142 250
                   L140 240 Q135 225 130 215 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.5" />
          <path d="M70 215 Q65 225 60 240 L58 250 Q60 255 70 255 L100 258 L130 255 Q140 255 142 250 L140 240 Q135 225 130 215 Z"
            fill={`url(#torso-${record.id})`} opacity="0.6" />
        </g>

        {/* Legs (less affected by bodyScale) */}
        <g transform={`translate(${(1 - bodyScale) * 15}, 0)`}>
          {/* Left Thigh */}
          <path d="M62 255 Q55 260 52 280
                   L48 320 Q47 335 50 340
                   L54 342 Q60 342 64 340 L68 335
                   Q72 320 70 280 L68 260 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.6" />
          <path d="M62 255 Q55 260 52 280 L48 320 Q47 335 50 340 L54 342 Q60 342 64 340 L68 335 Q72 320 70 280 L68 260 Z"
            fill={`url(#muscle-${record.id})`} />

          {/* Left Calf */}
          <path d="M50 340 Q46 345 45 360
                   L44 385 Q44 395 48 398
                   L56 400 Q62 398 64 395
                   L65 385 L66 360
                   Q66 345 64 340 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.5" />

          {/* Left Foot */}
          <path d="M44 398 L40 405 Q38 412 44 414 L60 414 Q66 412 66 405 L64 398 Z"
            fill={skinBase} stroke="hsl(25, 30%, 60%)" strokeWidth="0.4" />

          {/* Right Thigh */}
          <path d="M132 255 Q125 260 122 280
                   L118 320 Q117 335 120 340
                   L124 342 Q130 342 134 340 L138 335
                   Q142 320 140 280 L138 260 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.6" />
          <path d="M132 255 Q125 260 122 280 L118 320 Q117 335 120 340 L124 342 Q130 342 134 340 L138 335 Q142 320 140 280 L138 260 Z"
            fill={`url(#muscle-${record.id})`} />

          {/* Right Calf */}
          <path d="M120 340 Q116 345 115 360
                   L114 385 Q114 395 118 398
                   L126 400 Q132 398 134 395
                   L135 385 L136 360
                   Q136 345 134 340 Z"
            fill={`url(#skin-${record.id})`} stroke="hsl(25, 30%, 60%)" strokeWidth="0.5" />

          {/* Right Foot */}
          <path d="M114 398 L110 405 Q108 412 114 414 L130 414 Q136 412 136 405 L134 398 Z"
            fill={skinBase} stroke="hsl(25, 30%, 60%)" strokeWidth="0.4" />
        </g>

        {/* Metric labels on body */}
        {size === "md" && (
          <>
            {/* Fat indicator on belly */}
            {record.body_fat_pct != null && (
              <g>
                <rect x="2" y="148" width="36" height="16" rx="4" fill={fatOverlay} opacity="0.9" />
                <text x="20" y="159" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">
                  {record.body_fat_pct}%
                </text>
                <line x1="38" y1="156" x2="55" y2="156" stroke={fatOverlay} strokeWidth="0.8" strokeDasharray="2 1" />
              </g>
            )}
            {/* Muscle indicator on arm */}
            {record.muscle_mass != null && (
              <g>
                <rect x="162" y="118" width="36" height="16" rx="4" fill={muscleOverlay} opacity="0.9" />
                <text x="180" y="129" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">
                  {record.muscle_mass}kg
                </text>
                <line x1="162" y1="126" x2="150" y2="130" stroke={muscleOverlay} strokeWidth="0.8" strokeDasharray="2 1" />
              </g>
            )}
            {/* Weight on top */}
            {record.weight != null && (
              <g>
                <rect x="162" y="78" width="36" height="16" rx="4" fill="hsl(220, 60%, 50%)" opacity="0.9" />
                <text x="180" y="89" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">
                  {record.weight}kg
                </text>
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  );
};

/* ── Diff Badge ── */
const DiffBadge = ({ diff, inverse = false }: { diff: number | null; inverse?: boolean }) => {
  if (diff == null || diff === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
  const isGood = inverse ? diff > 0 : diff < 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${isGood ? "text-accent" : "text-destructive"}`}>
      {diff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(diff).toFixed(1)}
    </span>
  );
};

const BioimpedanceDialog = ({ open, onOpenChange, studentId, studentName }: Props) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<BioRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("main");
  const [uploading, setUploading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BioRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = { measured_at: new Date().toISOString().split("T")[0], notes: "" };
    NUMERIC_KEYS.forEach(k => init[k] = "");
    return init;
  });
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    if (open && studentId) { fetchRecords(); setView("main"); }
  }, [open, studentId]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("student_bioimpedance")
      .select("*")
      .eq("student_id", studentId)
      .order("measured_at", { ascending: false });
    setRecords((data as any[]) || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `bioimpedance/${studentId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("exercise-videos").upload(path, file);
    if (error) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("exercise-videos").getPublicUrl(path);
    setFileUrl(urlData.publicUrl);
    setUploading(false);
    toast.success("Arquivo enviado!");
  };

  const handleSave = async () => {
    const payload: any = {
      student_id: studentId,
      professor_id: user!.id,
      measured_at: form.measured_at,
      file_url: fileUrl || null,
      notes: form.notes || null,
    };
    NUMERIC_KEYS.forEach(k => {
      payload[k] = form[k] ? parseFloat(form[k]) : null;
    });
    if (form.age) payload.age = parseInt(form.age);
    if (form.cellular_age) payload.cellular_age = parseInt(form.cellular_age);

    const { error } = await supabase.from("student_bioimpedance").insert(payload);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Bioimpedância registrada!");
    setView("main");
    const init: Record<string, string> = { measured_at: new Date().toISOString().split("T")[0], notes: "" };
    NUMERIC_KEYS.forEach(k => init[k] = "");
    setForm(init);
    setFileUrl("");
    fetchRecords();
  };

  const getDiff = (current: number | null, previous: number | null) => {
    if (current == null || previous == null) return null;
    return current - previous;
  };

  const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  const formatDateShort = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return `${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear().toString().slice(2)}`;
  };

  // Chart data (chronological)
  const chartData = [...records].reverse().map(r => ({
    date: formatDateShort(r.measured_at),
    fullDate: formatDate(r.measured_at),
    peso: r.weight,
    imc: r.bmi,
    gordura: r.body_fat_pct,
    massaMagra: r.lean_mass,
    massaMuscular: r.muscle_mass,
    massaGorda: r.fat_mass,
    agua: r.total_body_water,
  }));

  // Radar chart data for latest vs oldest
  const radarData = (() => {
    if (records.length < 2) return [];
    const latest = records[0];
    const oldest = records[records.length - 1];
    const metrics = [
      { subject: "Peso", A: oldest.weight, B: latest.weight },
      { subject: "Massa Magra", A: oldest.lean_mass, B: latest.lean_mass },
      { subject: "Massa Muscular", A: oldest.muscle_mass, B: latest.muscle_mass },
      { subject: "Massa Gorda", A: oldest.fat_mass, B: latest.fat_mass },
      { subject: "Água", A: oldest.total_body_water, B: latest.total_body_water },
      { subject: "Metabolismo", A: oldest.basal_metabolism ? oldest.basal_metabolism / 10 : null, B: latest.basal_metabolism ? latest.basal_metabolism / 10 : null },
    ];
    return metrics.filter(m => m.A != null && m.B != null);
  })();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg">
        <p className="text-xs font-bold text-foreground mb-1">{payload[0]?.payload?.fullDate || label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  // ── MAIN VIEW ──
  const renderMain = () => (
    <div className="space-y-3 mt-2">
      <button onClick={() => setView("form")} className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-display font-bold text-primary">Nova Avaliação</span>
      </button>

      {records.length >= 2 && (
        <button onClick={() => setView("compare")} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-gradient-to-r from-card to-secondary/30 hover:border-primary/30 transition-all">
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left flex-1">
            <span className="text-sm font-display font-bold text-foreground">Ver Comparativo</span>
            <p className="text-[10px] text-muted-foreground">Gráficos de evolução e avatar corporal</p>
          </div>
          <ArrowUp className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pt-2">Histórico ({records.length})</p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : records.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">Nenhuma avaliação registrada</p>
      ) : (
        <div className="space-y-2">
          {records.map((r, idx) => {
            const prev = records[idx + 1];
            return (
              <button key={r.id} onClick={() => { setSelectedRecord(r); setView("detail"); }}
                className="w-full rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all text-left group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="font-display font-bold text-sm text-foreground">{formatDate(r.measured_at)}</p>
                  </div>
                  {idx === 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/15 text-primary">ATUAL</span>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Scale, label: "Peso", value: r.weight, unit: "kg", prev: prev?.weight },
                    { icon: Activity, label: "IMC", value: r.bmi, unit: "", prev: prev?.bmi },
                    { icon: Percent, label: "Gordura", value: r.body_fat_pct, unit: "%", prev: prev?.body_fat_pct },
                  ].map(({ icon: Icon, label, value, unit, prev: prevVal }) => {
                    const diff = getDiff(value, prevVal);
                    return (
                      <div key={label} className="bg-secondary/60 rounded-lg p-2 group-hover:bg-secondary/80 transition-colors">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground">
                            {value != null ? `${value}${unit ? ` ${unit}` : ""}` : "—"}
                          </p>
                          {diff != null && diff !== 0 && <DiffBadge diff={diff} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── DETAIL VIEW ──
  const renderDetail = () => {
    if (!selectedRecord) return null;
    const idx = records.findIndex(r => r.id === selectedRecord.id);
    const prev = idx >= 0 ? records[idx + 1] : undefined;

    return (
      <div className="space-y-4 mt-2">
        <button onClick={() => setView("main")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center justify-between">
          <p className="font-display font-bold text-foreground text-lg">{formatDate(selectedRecord.measured_at)}</p>
        </div>

        <div className="flex justify-center py-2">
          <HumanBody record={selectedRecord} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FIELD_LABELS.map(({ key, label, unit }) => {
            const val = selectedRecord[key] as number | null;
            if (val == null) return null;
            const diff = prev ? getDiff(val, prev[key] as number | null) : null;
            return (
              <div key={key} className="bg-secondary/50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{val}{unit && ` ${unit}`}</p>
                  {diff != null && diff !== 0 && <DiffBadge diff={diff} />}
                </div>
              </div>
            );
          })}
        </div>

        {selectedRecord.notes && (
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Observações</p>
            <p className="text-sm text-foreground">{selectedRecord.notes}</p>
          </div>
        )}
        {selectedRecord.file_url && (
          <a href={selectedRecord.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block">Ver exame anexado</a>
        )}
      </div>
    );
  };

  // ── COMPARE VIEW ──
  const renderCompare = () => {
    const latest = records[0];
    const oldest = records[records.length - 1];

    const compareMetrics = [
      { label: "Peso", key: "weight" as keyof BioRecord, unit: "kg", icon: "⚖️" },
      { label: "IMC", key: "bmi" as keyof BioRecord, unit: "", icon: "📊" },
      { label: "% Gordura", key: "body_fat_pct" as keyof BioRecord, unit: "%", icon: "🔥" },
      { label: "Massa Magra", key: "lean_mass" as keyof BioRecord, unit: "kg", icon: "💪" },
      { label: "Massa Muscular", key: "muscle_mass" as keyof BioRecord, unit: "kg", icon: "🏋️" },
      { label: "Massa Gorda", key: "fat_mass" as keyof BioRecord, unit: "kg", icon: "📉" },
      { label: "Metabolismo", key: "basal_metabolism" as keyof BioRecord, unit: "kcal", icon: "⚡" },
      { label: "Água Corporal", key: "total_body_water" as keyof BioRecord, unit: "L", icon: "💧" },
    ];

    return (
      <div className="space-y-5 mt-2">
        <button onClick={() => setView("main")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="text-center">
          <p className="font-display font-bold text-foreground text-lg">Evolução Corporal</p>
          <p className="text-xs text-muted-foreground">{records.length} avaliações registradas</p>
        </div>

        {/* Avatar comparison */}
        {latest && oldest && records.length >= 2 && (
          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/30 to-card p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">{formatDate(oldest.measured_at)}</p>
                <p className="text-[9px] text-muted-foreground mb-2">Início</p>
                <HumanBody record={oldest} size="sm" />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-primary font-bold uppercase mb-1">{formatDate(latest.measured_at)}</p>
                <p className="text-[9px] text-primary mb-2">Atual</p>
                <HumanBody record={latest} size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* Detailed comparison table */}
        {latest && oldest && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 bg-secondary/70 px-3 py-2">
              <p className="text-[10px] font-bold text-muted-foreground">Métrica</p>
              <p className="text-[10px] font-bold text-muted-foreground text-center">Início</p>
              <p className="text-[10px] font-bold text-muted-foreground text-center">Atual</p>
              <p className="text-[10px] font-bold text-muted-foreground text-right">Diff</p>
            </div>
            {compareMetrics.map(({ label, key, unit, icon }) => {
              const oldVal = oldest[key] as number | null;
              const newVal = latest[key] as number | null;
              if (oldVal == null && newVal == null) return null;
              const diff = getDiff(newVal, oldVal);
              return (
                <div key={key} className="grid grid-cols-4 items-center px-3 py-2 border-t border-border/50 hover:bg-secondary/30 transition-colors">
                  <p className="text-xs text-foreground">{icon} {label}</p>
                  <p className="text-xs font-medium text-muted-foreground text-center">{oldVal ?? "—"}{oldVal != null && unit ? ` ${unit}` : ""}</p>
                  <p className="text-xs font-bold text-foreground text-center">{newVal ?? "—"}{newVal != null && unit ? ` ${unit}` : ""}</p>
                  <div className="flex justify-end">{diff != null ? <DiffBadge diff={diff} /> : <span className="text-xs text-muted-foreground">—</span>}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-bold text-foreground mb-3 text-center">Perfil Corporal</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar name="Início" dataKey="A" stroke="hsl(0, 60%, 55%)" fill="hsl(0, 60%, 55%)" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Atual" dataKey="B" stroke="hsl(150, 55%, 45%)" fill="hsl(150, 55%, 45%)" fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Line Charts */}
        {chartData.length >= 2 && (
          <>
            {/* Weight + Body Composition */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-3">Peso & Composição (kg)</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220, 60%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(220, 60%, 50%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gordGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 60%, 55%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(0, 60%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="peso" stroke="hsl(220, 60%, 50%)" fill="url(#pesoGrad)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} name="Peso" />
                    <Area type="monotone" dataKey="massaGorda" stroke="hsl(0, 60%, 55%)" fill="url(#gordGrad)" strokeWidth={2} dot={{ r: 3 }} name="M. Gorda" />
                    <Line type="monotone" dataKey="massaMagra" stroke="hsl(150, 55%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="M. Magra" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fat % & IMC */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-3">% Gordura & IMC</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="gordura" stroke="hsl(0, 65%, 55%)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} name="% Gordura" />
                    <Line type="monotone" dataKey="imc" stroke="hsl(35, 85%, 50%)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} name="IMC" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar chart: muscle vs fat mass */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-3">Músculo vs Gordura (kg)</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="massaMuscular" fill="hsl(150, 55%, 45%)" radius={[4, 4, 0, 0]} name="Muscular" />
                    <Bar dataKey="massaGorda" fill="hsl(0, 60%, 55%)" radius={[4, 4, 0, 0]} name="Gorda" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── FORM VIEW ──
  const renderForm = () => (
    <div className="space-y-4 mt-2">
      <button onClick={() => setView("main")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <div>
        <label className="text-sm font-medium text-foreground">Data da Medição</label>
        <input type="date" value={form.measured_at} onChange={(e) => setForm({ ...form, measured_at: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FIELD_LABELS.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="text-xs font-medium text-foreground">{label} {unit && `(${unit})`}</label>
            <input type="number" step={key === "age" || key === "cellular_age" ? "1" : "0.01"} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Upload do Exame (foto/PDF)</label>
        <div className="mt-1">
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground cursor-pointer hover:bg-secondary/80">
            <Upload className="w-4 h-4" />
            {uploading ? "Enviando..." : fileUrl ? "Arquivo enviado ✓" : "Selecionar arquivo"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Observações</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
      </div>
      <button onClick={handleSave} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors">Salvar Bioimpedância</button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Bioimpedância — {studentName}
          </DialogTitle>
        </DialogHeader>
        {view === "main" && renderMain()}
        {view === "form" && renderForm()}
        {view === "detail" && renderDetail()}
        {view === "compare" && renderCompare()}
      </DialogContent>
    </Dialog>
  );
};

export default BioimpedanceDialog;
