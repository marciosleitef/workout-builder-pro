import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ExerciseLibrary from "@/components/ExerciseLibrary";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { ExerciseGroup, WorkoutExercise } from "@/types/workout";
import { type Exercise } from "@/data/exercises";
import { Dumbbell, ArrowLeft } from "lucide-react";

const Index = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState("");
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

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

  const handleAddExercise = useCallback(
    (exercise: Exercise) => {
      // If no groups, create one first
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

      // Add to last group or active group
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
        {studentId && (
          <button onClick={() => navigate("/dashboard")} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold gradient-text">
            {studentName ? `Treino — ${studentName}` : "Workout Builder"}
          </h1>
          <p className="text-xs text-muted-foreground">Monte seu treino ideal</p>
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
          <WorkoutBuilder groups={groups} setGroups={setGroups} />
        </main>
      </div>
    </div>
  );
};

export default Index;
