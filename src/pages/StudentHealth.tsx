import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentBottomNav from "@/components/StudentBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Heart, Activity, Scale, Droplets, Moon, Gauge, Thermometer, Plus,
  TrendingUp, TrendingDown, Minus
} from "lucide-react";
import { useStudentScores } from "@/hooks/useStudentScores";

const StudentHealth = () => {
  const { user, studentId } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [latestBio, setLatestBio] = useState<any>(null);
  const [showDailyForm, setShowDailyForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { scores } = useStudentScores(studentId ? [studentId] : []);
  const score = studentId ? scores[studentId] : undefined;

  useEffect(() => {
    if (!studentId) return;
    fetchStudent();
    fetchDailyRecords();
    fetchBioimpedance();
  }, [studentId]);

  const fetchStudent = async () => {
    const { data } = await supabase.from("students").select("*").eq("id", studentId!).single();
    setStudent(data);
  };

  const fetchDailyRecords = async () => {
    const { data } = await supabase
      .from("student_daily_records")
      .select("*")
      .eq("student_id", studentId!)
      .order("recorded_at", { ascending: false })
      .limit(10);
    setDailyRecords(data || []);
  };

  const fetchBioimpedance = async () => {
    const { data } = await supabase
      .from("student_bioimpedance")
      .select("*")
      .eq("student_id", studentId!)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatestBio(data);
  };

  const saveDailyRecord = async () => {
    if (!studentId || !student) return;
    setSaving(true);
    try {
      const record = {
        student_id: studentId,
        professor_id: student.professor_id,
        weight: formData.weight ? Number(formData.weight) : null,
        height: formData.height ? Number(formData.height) : null,
        blood_pressure_systolic: formData.systolic ? Number(formData.systolic) : null,
        blood_pressure_diastolic: formData.diastolic ? Number(formData.diastolic) : null,
        oxygen_saturation: formData.o2 ? Number(formData.o2) : null,
        sleep_hours: formData.sleep ? Number(formData.sleep) : null,
        resting_bpm: formData.bpm ? Number(formData.bpm) : null,
        hydration_level: formData.hydration || null,
        notes: formData.notes || null,
      };

      // Calculate BMI if weight and height
      if (record.weight && record.height) {
        const h = record.height / 100;
        (record as any).bmi = Math.round((record.weight / (h * h)) * 10) / 10;
      }

      const { error } = await supabase.from("student_daily_records").insert(record);
      if (error) throw error;
      toast.success("Indicadores registrados!");
      setShowDailyForm(false);
      setFormData({});
      fetchDailyRecords();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const latest = dailyRecords[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold font-display">Saúde</h1>
          <Button size="sm" onClick={() => setShowDailyForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Registrar
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Scores */}
        {score && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium">Score Saúde</span>
                </div>
                <p className="text-2xl font-bold">{score.health}<span className="text-sm text-muted-foreground">/100</span></p>
                <Progress value={score.health} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Score Performance</span>
                </div>
                <p className="text-2xl font-bold">{score.performance}<span className="text-sm text-muted-foreground">/100</span></p>
                <Progress value={score.performance} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Latest daily record */}
        {latest && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Últimos Indicadores</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {format(new Date(latest.recorded_at), "dd/MM/yyyy")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {latest.weight && (
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="text-sm font-semibold">{latest.weight} kg</p>
                    </div>
                  </div>
                )}
                {latest.bmi && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">IMC</p>
                      <p className="text-sm font-semibold">{latest.bmi}</p>
                    </div>
                  </div>
                )}
                {latest.blood_pressure_systolic && (
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pressão</p>
                      <p className="text-sm font-semibold">{latest.blood_pressure_systolic}/{latest.blood_pressure_diastolic}</p>
                    </div>
                  </div>
                )}
                {latest.oxygen_saturation && (
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">SpO2</p>
                      <p className="text-sm font-semibold">{latest.oxygen_saturation}%</p>
                    </div>
                  </div>
                )}
                {latest.sleep_hours && (
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sono</p>
                      <p className="text-sm font-semibold">{latest.sleep_hours}h</p>
                    </div>
                  </div>
                )}
                {latest.resting_bpm && (
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">BPM Repouso</p>
                      <p className="text-sm font-semibold">{latest.resting_bpm}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bioimpedance summary */}
        {latestBio && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Bioimpedância</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {format(new Date(latestBio.measured_at), "dd/MM/yyyy")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {latestBio.weight && (
                  <div><p className="text-xs text-muted-foreground">Peso</p><p className="text-sm font-semibold">{latestBio.weight} kg</p></div>
                )}
                {latestBio.body_fat_pct && (
                  <div><p className="text-xs text-muted-foreground">% Gordura</p><p className="text-sm font-semibold">{latestBio.body_fat_pct}%</p></div>
                )}
                {latestBio.muscle_mass && (
                  <div><p className="text-xs text-muted-foreground">Massa Muscular</p><p className="text-sm font-semibold">{latestBio.muscle_mass} kg</p></div>
                )}
                {latestBio.visceral_fat && (
                  <div><p className="text-xs text-muted-foreground">Gordura Visceral</p><p className="text-sm font-semibold">{latestBio.visceral_fat}</p></div>
                )}
                {latestBio.body_water_pct && (
                  <div><p className="text-xs text-muted-foreground">% Água</p><p className="text-sm font-semibold">{latestBio.body_water_pct}%</p></div>
                )}
                {latestBio.basal_metabolism && (
                  <div><p className="text-xs text-muted-foreground">TMB</p><p className="text-sm font-semibold">{latestBio.basal_metabolism} kcal</p></div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History list */}
        {dailyRecords.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Histórico de Registros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dailyRecords.slice(1).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground">{format(new Date(r.recorded_at), "dd/MM/yyyy")}</span>
                  <div className="flex items-center gap-3 text-xs">
                    {r.weight && <span>{r.weight}kg</span>}
                    {r.blood_pressure_systolic && <span>{r.blood_pressure_systolic}/{r.blood_pressure_diastolic}</span>}
                    {r.sleep_hours && <span>{r.sleep_hours}h sono</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Daily Record Form */}
      <Dialog open={showDailyForm} onOpenChange={setShowDailyForm}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Indicadores</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Peso (kg)</Label>
                <Input type="number" step="0.1" value={formData.weight || ""} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Altura (cm)</Label>
                <Input type="number" value={formData.height || ""} onChange={e => setFormData({ ...formData, height: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Pressão Sistólica</Label>
                <Input type="number" value={formData.systolic || ""} onChange={e => setFormData({ ...formData, systolic: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Pressão Diastólica</Label>
                <Input type="number" value={formData.diastolic || ""} onChange={e => setFormData({ ...formData, diastolic: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">SpO2 (%)</Label>
                <Input type="number" value={formData.o2 || ""} onChange={e => setFormData({ ...formData, o2: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Horas de Sono</Label>
                <Input type="number" step="0.5" value={formData.sleep || ""} onChange={e => setFormData({ ...formData, sleep: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">BPM Repouso</Label>
                <Input type="number" value={formData.bpm || ""} onChange={e => setFormData({ ...formData, bpm: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Hidratação</Label>
                <Select value={formData.hydration || ""} onValueChange={v => setFormData({ ...formData, hydration: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Muito Baixa", "Baixa", "Moderada", "Adequada", "Boa"].map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Input value={formData.notes || ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <Button className="w-full" onClick={saveDailyRecord} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Indicadores"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StudentBottomNav />
    </div>
  );
};

export default StudentHealth;
