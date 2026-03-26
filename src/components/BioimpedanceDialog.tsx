import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Upload, TrendingUp, ArrowLeft, BarChart3, Scale, Percent, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
    if (open && studentId) {
      fetchRecords();
      setView("main");
    }
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

  // Chart data (chronological order)
  const chartData = [...records].reverse().map(r => ({
    date: formatDate(r.measured_at),
    peso: r.weight,
    imc: r.bmi,
    gordura: r.body_fat_pct,
    massaMagra: r.lean_mass,
    massaMuscular: r.muscle_mass,
  }));

  // Body avatar component
  const BodyAvatar = ({ record }: { record: BioRecord }) => {
    const fatPct = record.body_fat_pct ?? 0;
    const musclePct = record.muscle_mass_pct ?? 0;
    const waterPct = record.body_water_pct ?? record.total_body_water ? ((record.total_body_water ?? 0) / (record.weight ?? 70) * 100) : 0;

    // Color intensities based on metrics
    const fatColor = fatPct > 30 ? "hsl(0, 70%, 55%)" : fatPct > 20 ? "hsl(35, 80%, 55%)" : "hsl(150, 60%, 45%)";
    const muscleColor = musclePct > 40 ? "hsl(150, 70%, 40%)" : musclePct > 30 ? "hsl(150, 50%, 50%)" : "hsl(200, 50%, 55%)";

    return (
      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 120 240" className="w-28 h-56" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <circle cx="60" cy="28" r="18" fill={muscleColor} opacity="0.8" stroke="hsl(var(--border))" strokeWidth="1" />
          {/* Neck */}
          <rect x="53" y="46" width="14" height="10" rx="3" fill={muscleColor} opacity="0.7" />
          {/* Torso */}
          <path d="M35 56 Q32 56 30 62 L26 110 Q25 118 32 120 L45 122 L60 124 L75 122 L88 120 Q95 118 94 110 L90 62 Q88 56 85 56 Z"
            fill={fatColor} opacity="0.7" stroke="hsl(var(--border))" strokeWidth="1" />
          {/* Left Arm */}
          <path d="M30 62 Q22 64 18 80 L14 110 Q12 116 16 118 L22 116 L26 110 L30 80 Z"
            fill={muscleColor} opacity="0.6" stroke="hsl(var(--border))" strokeWidth="0.8" />
          {/* Right Arm */}
          <path d="M90 62 Q98 64 102 80 L106 110 Q108 116 104 118 L98 116 L94 110 L90 80 Z"
            fill={muscleColor} opacity="0.6" stroke="hsl(var(--border))" strokeWidth="0.8" />
          {/* Left Leg */}
          <path d="M40 122 Q36 124 34 140 L30 190 Q28 200 34 202 L42 200 L44 190 L46 140 L48 124 Z"
            fill={muscleColor} opacity="0.65" stroke="hsl(var(--border))" strokeWidth="0.8" />
          {/* Right Leg */}
          <path d="M80 122 Q84 124 86 140 L90 190 Q92 200 86 202 L78 200 L76 190 L74 140 L72 124 Z"
            fill={muscleColor} opacity="0.65" stroke="hsl(var(--border))" strokeWidth="0.8" />
          {/* Left Foot */}
          <ellipse cx="34" cy="206" rx="10" ry="5" fill={muscleColor} opacity="0.5" />
          {/* Right Foot */}
          <ellipse cx="86" cy="206" rx="10" ry="5" fill={muscleColor} opacity="0.5" />
        </svg>

        {/* Metric indicators around avatar */}
        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="text-center bg-secondary/50 rounded-lg py-1.5 px-1">
            <p className="text-[9px] text-muted-foreground">Gordura</p>
            <p className="text-xs font-bold" style={{ color: fatColor }}>{record.body_fat_pct ?? "—"}%</p>
          </div>
          <div className="text-center bg-secondary/50 rounded-lg py-1.5 px-1">
            <p className="text-[9px] text-muted-foreground">Músculo</p>
            <p className="text-xs font-bold" style={{ color: muscleColor }}>{record.muscle_mass_pct ?? record.muscle_mass ?? "—"}{record.muscle_mass_pct ? "%" : "kg"}</p>
          </div>
          <div className="text-center bg-secondary/50 rounded-lg py-1.5 px-1">
            <p className="text-[9px] text-muted-foreground">Água</p>
            <p className="text-xs font-bold text-blue-500">{record.body_water_pct ?? (waterPct > 0 ? waterPct.toFixed(1) : "—")}%</p>
          </div>
        </div>
      </div>
    );
  };

  // MAIN VIEW
  const renderMain = () => (
    <div className="space-y-3 mt-2">
      <button onClick={() => setView("form")} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-primary/40 hover:border-primary/70 bg-primary/5 hover:bg-primary/10 transition-colors">
        <Plus className="w-5 h-5 text-primary" />
        <span className="text-sm font-display font-bold text-primary">Nova Avaliação</span>
      </button>

      {records.length >= 2 && (
        <button onClick={() => setView("compare")} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
          <BarChart3 className="w-5 h-5 text-primary" />
          <div className="text-left">
            <span className="text-sm font-display font-bold text-foreground">Ver Comparativo</span>
            <p className="text-[10px] text-muted-foreground">Gráficos de evolução e avatar corporal</p>
          </div>
        </button>
      )}

      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider pt-1">Histórico de Avaliações</p>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">Nenhuma avaliação registrada</p>
      ) : (
        <div className="space-y-2">
          {records.map((r, idx) => {
            const prev = records[idx + 1];
            return (
              <button
                key={r.id}
                onClick={() => { setSelectedRecord(r); setView("detail"); }}
                className="w-full rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-display font-bold text-sm text-foreground">{formatDate(r.measured_at)}</p>
                  {idx === 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/15 text-primary">MAIS RECENTE</span>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Scale, label: "Peso", value: r.weight, unit: "kg", prev: prev?.weight },
                    { icon: Activity, label: "IMC", value: r.bmi, unit: "", prev: prev?.bmi },
                    { icon: Percent, label: "Gordura", value: r.body_fat_pct, unit: "%", prev: prev?.body_fat_pct },
                  ].map(({ icon: Icon, label, value, unit, prev: prevVal }) => {
                    const diff = getDiff(value, prevVal);
                    return (
                      <div key={label} className="bg-secondary/50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {value != null ? `${value}${unit ? ` ${unit}` : ""}` : "—"}
                          {diff != null && diff !== 0 && (
                            <span className={`text-[10px] ml-1 ${diff > 0 ? "text-destructive" : "text-accent"}`}>
                              {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                            </span>
                          )}
                        </p>
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

  // DETAIL VIEW (full record)
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
          <p className="font-display font-bold text-foreground">{formatDate(selectedRecord.measured_at)}</p>
        </div>

        {/* Body Avatar */}
        <div className="flex justify-center">
          <BodyAvatar record={selectedRecord} />
        </div>

        {/* All metrics */}
        <div className="grid grid-cols-2 gap-2">
          {FIELD_LABELS.map(({ key, label, unit }) => {
            const val = selectedRecord[key] as number | null;
            if (val == null) return null;
            const diff = prev ? getDiff(val, prev[key] as number | null) : null;
            return (
              <div key={key} className="bg-secondary/50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground">
                  {val}{unit && ` ${unit}`}
                  {diff != null && diff !== 0 && (
                    <span className={`text-[10px] ml-1 ${diff > 0 ? "text-destructive" : "text-accent"}`}>
                      {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                    </span>
                  )}
                </p>
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
          <a href={selectedRecord.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block">
            Ver exame anexado
          </a>
        )}
      </div>
    );
  };

  // COMPARE VIEW (charts + avatar evolution)
  const renderCompare = () => {
    const latest = records[0];
    const oldest = records[records.length - 1];

    return (
      <div className="space-y-5 mt-2">
        <button onClick={() => setView("main")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <p className="font-display font-bold text-foreground text-center">Evolução Corporal</p>

        {/* Avatar comparison side by side */}
        {latest && oldest && records.length >= 2 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase">
                {formatDate(oldest.measured_at)}
              </p>
              <BodyAvatar record={oldest} />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase">
                {formatDate(latest.measured_at)} <span className="text-primary">(atual)</span>
              </p>
              <BodyAvatar record={latest} />
            </div>
          </div>
        )}

        {/* Summary cards */}
        {latest && oldest && records.length >= 2 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Peso", val: getDiff(latest.weight, oldest.weight), unit: "kg" },
              { label: "IMC", val: getDiff(latest.bmi, oldest.bmi), unit: "" },
              { label: "% Gordura", val: getDiff(latest.body_fat_pct, oldest.body_fat_pct), unit: "%" },
            ].map(({ label, val, unit }) => (
              <div key={label} className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={`text-sm font-bold ${val == null ? "text-foreground" : val > 0 ? "text-destructive" : val < 0 ? "text-accent" : "text-foreground"}`}>
                  {val != null ? `${val > 0 ? "+" : ""}${val.toFixed(1)}${unit ? ` ${unit}` : ""}` : "—"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {chartData.length >= 2 && (
          <>
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Peso (kg)</p>
              <div className="h-44 bg-secondary/30 rounded-xl p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="peso" stroke="hsl(220, 60%, 50%)" strokeWidth={2} dot={{ r: 4 }} name="Peso" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground mb-2">Composição Corporal (%)</p>
              <div className="h-44 bg-secondary/30 rounded-xl p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="gordura" stroke="hsl(0, 65%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="% Gordura" />
                    <Line type="monotone" dataKey="imc" stroke="hsl(35, 85%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="IMC" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground mb-2">Massa Magra e Muscular (kg)</p>
              <div className="h-44 bg-secondary/30 rounded-xl p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="massaMagra" stroke="hsl(150, 55%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Massa Magra" />
                    <Line type="monotone" dataKey="massaMuscular" stroke="hsl(220, 60%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="Massa Muscular" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // FORM VIEW
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
            <input
              type="number"
              step={key === "age" || key === "cellular_age" ? "1" : "0.01"}
              value={form[key] || ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Upload do Exame (foto/PDF)</label>
        <div className="mt-1 flex items-center gap-2">
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

      <button onClick={handleSave} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors">
        Salvar Bioimpedância
      </button>
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
