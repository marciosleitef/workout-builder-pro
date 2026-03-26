import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Upload, TrendingUp, ArrowLeft } from "lucide-react";

interface BioRecord {
  id: string;
  measured_at: string;
  weight: number | null;
  body_fat_pct: number | null;
  lean_mass: number | null;
  muscle_mass: number | null;
  visceral_fat: number | null;
  basal_metabolism: number | null;
  body_water_pct: number | null;
  bone_mass: number | null;
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
  { key: "body_fat_pct", label: "% Gordura", unit: "%" },
  { key: "lean_mass", label: "Massa Magra", unit: "kg" },
  { key: "muscle_mass", label: "Massa Muscular", unit: "kg" },
  { key: "visceral_fat", label: "Gordura Visceral", unit: "" },
  { key: "basal_metabolism", label: "Metabolismo Basal", unit: "kcal" },
  { key: "body_water_pct", label: "% Água Corporal", unit: "%" },
  { key: "bone_mass", label: "Massa Óssea", unit: "kg" },
];

const BioimpedanceDialog = ({ open, onOpenChange, studentId, studentName }: Props) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<BioRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    measured_at: new Date().toISOString().split("T")[0],
    weight: "", body_fat_pct: "", lean_mass: "", muscle_mass: "",
    visceral_fat: "", basal_metabolism: "", body_water_pct: "", bone_mass: "", notes: "",
  });
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    if (open && studentId) fetchRecords();
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
      weight: form.weight ? parseFloat(form.weight) : null,
      body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
      lean_mass: form.lean_mass ? parseFloat(form.lean_mass) : null,
      muscle_mass: form.muscle_mass ? parseFloat(form.muscle_mass) : null,
      visceral_fat: form.visceral_fat ? parseFloat(form.visceral_fat) : null,
      basal_metabolism: form.basal_metabolism ? parseFloat(form.basal_metabolism) : null,
      body_water_pct: form.body_water_pct ? parseFloat(form.body_water_pct) : null,
      bone_mass: form.bone_mass ? parseFloat(form.bone_mass) : null,
      file_url: fileUrl || null,
      notes: form.notes || null,
    };
    const { error } = await supabase.from("student_bioimpedance").insert(payload);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Bioimpedância registrada!");
    setShowForm(false);
    setForm({ measured_at: new Date().toISOString().split("T")[0], weight: "", body_fat_pct: "", lean_mass: "", muscle_mass: "", visceral_fat: "", basal_metabolism: "", body_water_pct: "", bone_mass: "", notes: "" });
    setFileUrl("");
    fetchRecords();
  };

  const getDiff = (current: number | null, previous: number | null) => {
    if (current == null || previous == null) return null;
    return current - previous;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Bioimpedância — {studentName}
          </DialogTitle>
        </DialogHeader>

        {showForm ? (
          <div className="space-y-4 mt-2">
            {showForm && (
              <button onClick={() => setShowForm(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Data da Medição</label>
              <input type="date" value={form.measured_at} onChange={(e) => setForm({ ...form, measured_at: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FIELD_LABELS.map(({ key, label, unit }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-foreground">{label} {unit && `(${unit})`}</label>
                  <input type="number" step="0.01" value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
        ) : (
          <div className="space-y-3 mt-2">
            <button onClick={() => setShowForm(true)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/30 transition-colors">
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Nova Avaliação</span>
            </button>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Nenhuma avaliação registrada</p>
            ) : (
              records.map((r, idx) => {
                const prev = records[idx + 1]; // next older record
                return (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="font-display font-bold text-sm text-foreground mb-2">
                      {new Date(r.measured_at + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FIELD_LABELS.map(({ key, label, unit }) => {
                        const val = r[key] as number | null;
                        if (val == null) return null;
                        const diff = prev ? getDiff(val, prev[key] as number | null) : null;
                        return (
                          <div key={key} className="bg-secondary/50 rounded-lg px-2 py-1.5">
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
                    {r.file_url && (
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">
                        Ver exame anexado
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BioimpedanceDialog;
