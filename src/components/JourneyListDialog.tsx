import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Target, BarChart3, CalendarDays, Dumbbell, Pencil, Trash2 } from "lucide-react";

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

interface JourneyListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  professorName: string;
  onOpenJourney?: (journey: Journey) => void;
  onEditJourney?: (journey: Journey) => void;
}

const JourneyListDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  professorName,
  onOpenJourney,
  onEditJourney,
}: JourneyListDialogProps) => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && studentId) fetchJourneys();
  }, [open, studentId]);

  const fetchJourneys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("workout_journeys")
      .select("id, name, objective, level, format, start_date, end_date, status")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar jornadas");
    else setJourneys(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("workout_journeys").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else {
      toast.success("Jornada removida");
      fetchJourneys();
    }
  };

  const getStatus = (j: Journey) => {
    const now = new Date();
    const end = new Date(j.end_date);
    const start = new Date(j.start_date);
    if (end < now) return { label: "Expirada", color: "hsl(220 15% 50%)", bg: "hsl(220 15% 50% / 0.15)" };
    if (start > now) return { label: "Agendada", color: "hsl(35 85% 50%)", bg: "hsl(35 85% 50% / 0.15)" };
    return { label: "Ativa", color: "hsl(150 60% 45%)", bg: "hsl(150 60% 45% / 0.15)" };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="font-display text-lg">Jornadas Disponíveis</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto scrollbar-thin space-y-4">
          {/* Student banner */}
          <div className="rounded-xl border border-border bg-secondary/50 px-4 py-3 flex items-center justify-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-display font-bold text-sm text-foreground">{studentName.toUpperCase()}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : journeys.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma jornada criada ainda</p>
          ) : (
            journeys.map((j) => {
              const status = getStatus(j);
              return (
                <div
                  key={j.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-bold text-foreground">{j.name}</p>
                      <span
                        className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ color: status.color, backgroundColor: status.bg }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenJourney?.(j)}
                        className="w-8 h-8 rounded-full bg-[hsl(150,60%,45%)] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                        title="Abrir treinos"
                      >
                        <Dumbbell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditJourney?.(j)}
                        className="w-8 h-8 rounded-full bg-[hsl(200,70%,50%)] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(j.id)}
                        className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Target className="w-3 h-3" />
                      <span>{j.objective || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BarChart3 className="w-3 h-3" />
                      <span>{j.level || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="w-3 h-3" />
                      <span>{j.format || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{professorName || "Professor"}</span>
                    </div>
                  </div>

                  {/* Date bar */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>
                      {new Date(j.start_date).toLocaleDateString("pt-BR")} até{" "}
                      {new Date(j.end_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyListDialog;
