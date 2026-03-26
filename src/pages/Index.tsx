import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ExerciseLibrary from "@/components/ExerciseLibrary";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { ExerciseGroup, WorkoutExercise } from "@/types/workout";
import { type Exercise } from "@/data/exercises";
import { Dumbbell, ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Index = () => {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const workoutId = searchParams.get("workoutId");
  const journeyId = searchParams.get("journeyId");
  const journeyFormat = searchParams.get("journeyFormat");
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  useEffect(() => {
    if (studentId) {
      supabase
        .from("students")
        .select("full_name")
        .eq("id", studentId)
        .single()
        .then(({ data }) => {
          if (data) setStudentName(data.full_name);
        });
    }
  }, [studentId]);

  useEffect(() => {
    if (workoutId) {
      supabase
        .from("workouts")
        .select("name, exercises_data")
        .eq("id", workoutId)
        .single()
        .then(({ data }) => {
          if (data) {
            setWorkoutName(data.name);
            if (data.exercises_data && Array.isArray(data.exercises_data) && (data.exercises_data as any[]).length > 0) {
              setGroups(data.exercises_data as unknown as ExerciseGroup[]);
            }
          }
        });
    }
  }, [workoutId]);

  const handleAddExercise = useCallback(
    (exercise: Exercise) => {
      if (groups.length === 0) {
        const newGroup: ExerciseGroup = {
          id: `group-${Date.now()}`,
          name: "Aquecimento",
          color: "hsl(82 85% 55% / 0.15)",
          items: [],
        };
        const item: WorkoutExercise = {
          id: `we-${Date.now()}-${exercise.id}`,
          exercise,
        };
        newGroup.items.push(item);
        setGroups([newGroup]);
        setActiveGroupId(newGroup.id);
        return;
      }

      const targetId = activeGroupId || groups[groups.length - 1].id;
      const item: WorkoutExercise = {
        id: `we-${Date.now()}-${exercise.id}`,
        exercise,
      };
      setGroups((prev) =>
        prev.map((g) => (g.id === targetId ? { ...g, items: [...g.items, item] } : g))
      );
    },
    [groups, activeGroupId]
  );

  const handleFinalize = async () => {
    if (!workoutId) {
      toast.error("Nenhum treino selecionado");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("workouts")
      .update({ exercises_data: groups as any })
      .eq("id", workoutId);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar treino");
      return;
    }
    toast.success("Treino salvo com sucesso!");
    setShowFinishDialog(true);
  };

  const handleAddAnother = () => {
    setShowFinishDialog(false);
    // Navigate back to dashboard where WorkoutInfoDialog can be opened for the same journey
    if (journeyId && journeyFormat) {
      navigate(`/students?addWorkout=true&journeyId=${journeyId}&journeyFormat=${journeyFormat}&studentId=${studentId}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoBack = () => {
    setShowFinishDialog(false);
    navigate("/dashboard");
  };

  const totalExercises = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with gradient matching other pages */}
      <header className="bg-foreground px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/15 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-primary-foreground/60" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground/60" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-primary-foreground truncate">
              {workoutName ? `Montagem de Treino — ${workoutName}` : "Montagem de Treino"}
            </h1>
            <p className="text-primary-foreground/40 text-xs truncate">
              {studentName ? `Aluno: ${studentName}` : "Monte seu treino ideal"}
            </p>
          </div>
          <button
            onClick={handleFinalize}
            disabled={saving || totalExercises === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground text-foreground font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Finalizar
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Exercise Library */}
        <aside className="w-[380px] border-r border-border bg-card flex-shrink-0 overflow-hidden">
          <ExerciseLibrary onAddExercise={handleAddExercise} />
        </aside>

        {/* Right: Workout Builder */}
        <main className="flex-1 overflow-hidden">
          <WorkoutBuilder groups={groups} setGroups={setGroups} activeGroupId={activeGroupId} onActiveGroupChange={setActiveGroupId} />
        </main>
      </div>

      {/* Finish dialog - ask if user wants to add another workout */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="bg-foreground px-5 py-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-primary-foreground font-display font-bold text-base">
                  Treino Salvo!
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/50 text-xs mt-0.5">
                  {workoutName} foi salvo com sucesso
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-foreground text-center font-medium">
              Deseja adicionar outro treino a esta jornada?
            </p>
            <button
              onClick={handleAddAnother}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-primary-foreground font-display font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <Dumbbell className="w-4 h-4" />
              Sim, adicionar outro treino
            </button>
            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground font-display font-bold text-sm hover:bg-secondary transition-colors"
            >
              Não, voltar ao painel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
