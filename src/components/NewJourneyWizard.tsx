import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowRight, ArrowLeft, Check, Star, Award, Trophy,
  CalendarDays, ListOrdered, Target, Info, Settings, Eye, EyeOff, Clock
} from "lucide-react";

interface NewJourneyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  onCreated: () => void;
}

const STEPS = ["Informações", "Objetivo", "Nível", "Formato", "Confirmação"];

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

const FORMATS = [
  { label: "Semanal", icon: CalendarDays },
  { label: "Numerico", icon: ListOrdered },
];

const NewJourneyWizard = ({ open, onOpenChange, studentId, studentName, onCreated }: NewJourneyWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    name: "",
    start_date: today,
    end_date: nextMonth,
    orientations: "",
    student_can_view: true,
    hide_on_expire: true,
    hide_until_start: true,
    objective: "",
    level: "",
    format: "",
  });

  const canNext = () => {
    if (step === 0) return form.name.trim() !== "";
    if (step === 1) return form.objective !== "";
    if (step === 2) return form.level !== "";
    if (step === 3) return form.format !== "";
    return true;
  };

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await supabase.from("workout_journeys").insert({
      professor_id: user?.id,
      student_id: studentId,
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      orientations: form.orientations,
      objective: form.objective,
      level: form.level,
      format: form.format,
      student_can_view: form.student_can_view,
      hide_on_expire: form.hide_on_expire,
      hide_until_start: form.hide_until_start,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao criar jornada");
    } else {
      toast.success("Jornada criada com sucesso!");
      onCreated();
      onOpenChange(false);
      // Reset
      setStep(0);
      setForm({
        name: "", start_date: today, end_date: nextMonth, orientations: "",
        student_can_view: true, hide_on_expire: true, hide_until_start: true,
        objective: "", level: "", format: "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(220,60%,45%)] to-[hsl(250,55%,50%)] px-6 py-5 text-white">
          <h2 className="font-display font-bold text-lg">Nova Jornada de Treino</h2>

          {/* Stepper */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center relative">
                <div className="flex items-center">
                  {i > 0 && (
                    <div
                      className="absolute right-1/2 top-[14px] h-0.5 w-[calc(100%-16px)] -translate-x-1/2"
                      style={{
                        backgroundColor: i <= step ? "hsl(150 60% 45%)" : "hsl(0 0% 100% / 0.3)",
                        left: "-50%",
                        width: "100%",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <div
                    className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: i <= step ? "hsl(150 60% 45%)" : "hsl(0 0% 100% / 0.2)",
                      color: i <= step ? "white" : "hsl(0 0% 100% / 0.6)",
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
                <span className="text-[9px] mt-1 text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">Informações Básicas</h3>
                <p className="text-sm text-muted-foreground">Preencha os dados iniciais da jornada</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nome da Jornada <span className="text-destructive">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Treino de Hipertrofia - Janeiro 2025"
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Período</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <span className="text-xs text-muted-foreground">Início</span>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full mt-0.5 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Fim</span>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full mt-0.5 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Orientações</label>
                <textarea
                  value={form.orientations}
                  onChange={(e) => setForm({ ...form, orientations: e.target.value })}
                  placeholder="Observações e orientações importantes..."
                  rows={3}
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Configurações</label>
                <div className="space-y-2 mt-2">
                  {[
                    { key: "student_can_view" as const, label: "Aluno pode visualizar", icon: Eye },
                    { key: "hide_on_expire" as const, label: "Ocultar ao expirar", icon: EyeOff },
                    { key: "hide_until_start" as const, label: "Ocultar até início", icon: Clock },
                  ].map((c) => (
                    <label key={c.key} className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setForm({ ...form, [c.key]: !form[c.key] })}
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                          form[c.key] ? "bg-primary" : "bg-secondary border border-border"
                        }`}
                      >
                        {form[c.key] && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">Selecione o Objetivo</h3>
                <p className="text-sm text-muted-foreground">Qual o objetivo principal desta jornada?</p>
              </div>
              <div className="space-y-3">
                {OBJECTIVES.map((obj) => (
                  <button
                    key={obj}
                    onClick={() => setForm({ ...form, objective: obj })}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
                      form.objective === obj
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <Target className={`w-5 h-5 shrink-0 ${form.objective === obj ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-display font-bold text-sm text-foreground flex-1">{obj}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        form.objective === obj ? "border-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {form.objective === obj && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">Selecione o Nível</h3>
                <p className="text-sm text-muted-foreground">Qual o nível de experiência do aluno?</p>
              </div>
              <div className="space-y-3">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl.label}
                    onClick={() => setForm({ ...form, level: lvl.label })}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
                      form.level === lvl.label
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <lvl.icon className={`w-5 h-5 shrink-0 ${form.level === lvl.label ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-display font-bold text-sm text-foreground flex-1">{lvl.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        form.level === lvl.label ? "border-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {form.level === lvl.label && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">Formato do Treino</h3>
                <p className="text-sm text-muted-foreground">Como será organizado o treino?</p>
              </div>
              <div className="space-y-3">
                {FORMATS.map((fmt) => (
                  <button
                    key={fmt.label}
                    onClick={() => setForm({ ...form, format: fmt.label })}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
                      form.format === fmt.label
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <fmt.icon className={`w-5 h-5 shrink-0 ${form.format === fmt.label ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-display font-bold text-sm text-foreground flex-1">{fmt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        form.format === fmt.label ? "border-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {form.format === fmt.label && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">Confirme os Dados</h3>
                <p className="text-sm text-muted-foreground">Revise as informações antes de criar</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> Informações Básicas
                </h4>
                <div className="text-sm text-muted-foreground">
                  <p>Nome: <span className="text-foreground">{form.name}</span></p>
                  <p>Período: <span className="text-foreground">
                    {new Date(form.start_date).toLocaleDateString("pt-BR")} até {new Date(form.end_date).toLocaleDateString("pt-BR")}
                  </span></p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" /> Configurações da Jornada
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Objetivo:</span>
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium text-foreground">{form.objective}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Nível:</span>
                  <span className="px-2 py-0.5 rounded-md bg-primary/20 text-xs font-medium text-primary">{form.level}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Formato:</span>
                  <span className="px-2 py-0.5 rounded-md bg-primary text-xs font-medium text-primary-foreground">{form.format}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" /> Configurações
                </h4>
                <div className="space-y-1">
                  {[
                    { value: form.student_can_view, label: "Aluno pode visualizar" },
                    { value: form.hide_on_expire, label: "Ocultar ao expirar" },
                    { value: form.hide_until_start, label: "Ocultar até início" },
                  ].map((c) => (
                    <p key={c.label} className="text-sm flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${c.value ? "bg-primary" : "bg-muted"}`}>
                        {c.value && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </span>
                      <span className="text-foreground">{c.label}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[hsl(250,55%,50%)] text-white font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[hsl(250,55%,50%)] text-white font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              {saving ? "Criando..." : "Criar Jornada"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewJourneyWizard;
