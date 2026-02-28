import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, X, CalendarDays, Dumbbell, Info, ChevronDown, ChevronUp, Printer, Play } from "lucide-react";

interface Workout {
  id: string;
  name: string;
  day_label: string;
  orientations: string | null;
  sort_order: number | null;
}

interface JourneyWorkoutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyId: string;
  journeyName: string;
  journeyFormat: string;
  studentName: string;
}

const JourneyWorkoutsDialog = ({
  open,
  onOpenChange,
  journeyId,
  journeyName,
  journeyFormat,
  studentName,
}: JourneyWorkoutsDialogProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOrientations, setShowOrientations] = useState(false);

  useEffect(() => {
    if (open && journeyId) fetchWorkouts();
    if (!open) {
      setSelectedWorkout(null);
      setShowOrientations(false);
    }
  }, [open, journeyId]);

  const fetchWorkouts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("workouts")
      .select("id, name, day_label, orientations, sort_order")
      .eq("journey_id", journeyId)
      .order("sort_order", { ascending: true });
    if (error) toast.error("Erro ao carregar treinos");
    else {
      setWorkouts(data || []);
      if (data && data.length > 0) setSelectedWorkout(data[0]);
    }
    setLoading(false);
  };

  const isWeekly = journeyFormat.toLowerCase() === "semanal";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(220,60%,45%)] to-[hsl(250,55%,50%)] px-4 py-4 text-white flex items-center gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-base truncate">{journeyName}</h2>
            <p className="text-white/60 text-xs">{studentName}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 max-h-[70vh] overflow-y-auto scrollbar-thin space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : workouts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum treino criado nesta jornada</p>
          ) : (
            <>
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
                      <button
                        key={w.id}
                        onClick={() => { setSelectedWorkout(w); setShowOrientations(false); }}
                        className={`shrink-0 rounded-xl p-3 min-w-[100px] text-left transition-all ${
                          isSelected
                            ? "bg-[hsl(250,55%,50%)] text-white shadow-lg shadow-[hsl(250,55%,50%)/0.3]"
                            : "bg-secondary border border-border text-foreground hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-[hsl(150,60%,45%)]" : "bg-muted-foreground/40"}`} />
                          <span className="text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="font-display font-bold text-sm truncate">{w.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Dumbbell className={`w-3 h-3 ${isSelected ? "text-white/70" : "text-muted-foreground"}`} />
                          <span className={`text-[10px] ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                            {w.day_label}
                          </span>
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
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {selectedWorkout.day_label}
                    </span>
                  </div>

                  {/* Orientations */}
                  {selectedWorkout.orientations && (
                    <div>
                      <button
                        onClick={() => setShowOrientations(!showOrientations)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Orientações</span>
                        {showOrientations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {showOrientations && (
                        <p className="mt-2 text-sm text-primary/80 bg-primary/5 rounded-lg px-3 py-2">
                          {selectedWorkout.orientations}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder for exercises (not yet stored in DB) */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
                <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Exercícios serão exibidos aqui quando salvos
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(220,60%,50%)] text-white font-display font-bold text-sm hover:opacity-90 transition-opacity">
                  <Printer className="w-4 h-4" />
                  Imprimir Treino
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(150,60%,45%)] text-white font-display font-bold text-sm hover:opacity-90 transition-opacity">
                  <Play className="w-4 h-4" />
                  Iniciar Treino
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyWorkoutsDialog;
