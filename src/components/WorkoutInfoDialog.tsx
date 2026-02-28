import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";

const WEEK_DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const NUMERIC_OPTIONS = Array.from({ length: 10 }, (_, i) => `Treino ${i + 1}`);

interface WorkoutInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyId: string;
  journeyFormat: string;
  studentId: string;
}

const WorkoutInfoDialog = ({
  open,
  onOpenChange,
  journeyId,
  journeyFormat,
  studentId,
}: WorkoutInfoDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dayLabel, setDayLabel] = useState("");
  const [name, setName] = useState("");
  const [orientations, setOrientations] = useState("");
  const [saving, setSaving] = useState(false);

  const isWeekly = journeyFormat.toLowerCase() === "semanal";
  const options = isWeekly ? WEEK_DAYS : NUMERIC_OPTIONS;

  const handleAdvance = async () => {
    if (!dayLabel || !name.trim()) {
      toast.error("Preencha a forma e o nome do treino");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("workouts")
      .insert({
        journey_id: journeyId,
        professor_id: user?.id,
        student_id: studentId,
        name,
        day_label: dayLabel,
        orientations,
      })
      .select("id")
      .single();
    setSaving(false);

    if (error) {
      toast.error("Erro ao criar treino");
      return;
    }

    onOpenChange(false);
    navigate(`/workout/${studentId}?workoutId=${data.id}`);
  };

  const handleClose = () => {
    onOpenChange(false);
    setDayLabel("");
    setName("");
    setOrientations("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(220,60%,45%)] to-[hsl(250,55%,50%)] px-6 py-4 text-white">
          <h2 className="font-display font-bold text-lg">Informações do Treino</h2>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto scrollbar-thin">
          <div>
            <p className="text-xs text-muted-foreground mb-3">Informações do Treino</p>
            <h3 className="font-display font-bold text-lg text-foreground">Dados do Treino</h3>
            <p className="text-sm text-muted-foreground">Preencha as informações básicas do treino</p>
          </div>

          {/* Forma do Treino */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Forma do Treino <span className="text-destructive">*</span>
            </label>
            <select
              value={dayLabel}
              onChange={(e) => setDayLabel(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option value="" disabled>
                Selecione a forma
              </option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Nome do Treino */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Nome do Treino <span className="text-destructive">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino A - Peito e Triceps"
              className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Orientações */}
          <div>
            <label className="text-sm font-medium text-foreground">Orientações</label>
            <textarea
              value={orientations}
              onChange={(e) => setOrientations(e.target.value)}
              placeholder="Observações e orientações para o treino..."
              rows={4}
              className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={handleAdvance}
            disabled={saving || !dayLabel || !name.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[hsl(250,55%,50%)] text-white font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <ArrowRight className="w-4 h-4" />
            {saving ? "Criando..." : "Avançar para Exercícios"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutInfoDialog;
