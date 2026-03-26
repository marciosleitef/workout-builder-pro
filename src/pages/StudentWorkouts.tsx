import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentBottomNav from "@/components/StudentBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Dumbbell, Check, Play, ChevronDown, ChevronUp, Clock, Info } from "lucide-react";

const StudentWorkouts = () => {
  const { user, studentId } = useAuth();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<Set<string>>(new Set());
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showOrientations, setShowOrientations] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    fetchJourneys();
  }, [studentId]);

  const fetchJourneys = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("workout_journeys")
      .select("*")
      .eq("student_id", studentId!)
      .eq("status", "active")
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false });

    setJourneys(data || []);
    if (data && data.length > 0) {
      setActiveJourney(data[0]);
      fetchWorkouts(data[0].id);
    }
  };

  const fetchWorkouts = async (journeyId: string) => {
    const [workoutsRes, checkinsRes] = await Promise.all([
      supabase.from("workouts").select("*").eq("journey_id", journeyId).order("sort_order"),
      supabase.from("workout_checkins").select("workout_id").eq("student_id", studentId!).eq("journey_id", journeyId),
    ]);

    setWorkouts(workoutsRes.data || []);
    setCheckins(new Set((checkinsRes.data || []).map((c: any) => c.workout_id)));
  };

  const handleCheckin = async (workoutId: string) => {
    if (!studentId || !activeJourney || !user) return;
    setCheckingIn(true);
    try {
      // Get professor_id from journey
      const { error } = await supabase.from("workout_checkins").insert({
        student_id: studentId,
        journey_id: activeJourney.id,
        workout_id: workoutId,
        professor_id: activeJourney.professor_id,
        checked_in_by: user.id,
      });
      if (error) throw error;
      setCheckins(prev => new Set([...prev, workoutId]));
      toast.success("Check-in realizado! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Erro no check-in");
    } finally {
      setCheckingIn(false);
    }
  };

  const parseExercises = (data: any): any[] => {
    if (!data) return [];
    try {
      return Array.isArray(data) ? data : JSON.parse(data);
    } catch {
      return [];
    }
  };

  const completedCount = workouts.filter(w => checkins.has(w.id)).length;
  const progress = workouts.length > 0 ? Math.round((completedCount / workouts.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold font-display">Meus Treinos</h1>
          {activeJourney && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px]">{activeJourney.name}</Badge>
              <span className="text-xs text-muted-foreground">{completedCount}/{workouts.length} completos</span>
              {activeJourney.orientations && (
                <button onClick={() => setShowOrientations(true)} className="text-muted-foreground hover:text-foreground">
                  <Info className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Journey selector if multiple */}
        {journeys.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {journeys.map((j) => (
              <button
                key={j.id}
                onClick={() => { setActiveJourney(j); fetchWorkouts(j.id); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  activeJourney?.id === j.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                }`}
              >
                {j.name}
              </button>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {workouts.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso da jornada</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Workouts list */}
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma jornada ativa no momento</p>
          </div>
        ) : (
          workouts.map((workout) => {
            const isDone = checkins.has(workout.id);
            const isExpanded = expandedWorkout === workout.id;
            const exercises = parseExercises(workout.exercises_data);

            return (
              <Card key={workout.id} className={isDone ? "border-green-500/30 bg-green-500/5" : ""}>
                <CardContent className="p-0">
                  <button
                    className="w-full p-4 flex items-center gap-3 text-left"
                    onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isDone ? "bg-green-500/20 text-green-600" : "bg-primary/10 text-primary"
                    }`}>
                      {isDone ? <Check className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{workout.name}</p>
                      <p className="text-xs text-muted-foreground">{workout.day_label} • {exercises.length} exercícios</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      {workout.orientations && (
                        <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">{workout.orientations}</p>
                      )}
                      
                      {/* Exercises */}
                      {exercises.map((group: any, gi: number) => (
                        <div key={gi}>
                          {group.name && <p className="text-xs font-semibold text-muted-foreground mb-1">{group.name}</p>}
                          {(group.items || []).map((item: any, ii: number) => {
                            const ex = item.type === "biset" ? item.exercises : [item];
                            return (
                              <div key={ii} className="ml-2">
                                {(Array.isArray(ex) ? ex : [ex]).map((e: any, ei: number) => (
                                  <div key={ei} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                                    {e.exercise?.image_url && (
                                      <img src={e.exercise.image_url} className="h-8 w-8 rounded object-cover" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{e.exercise?.name || "Exercício"}</p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {[
                                          e.sets && `${e.sets}x`,
                                          e.reps && `${e.reps} reps`,
                                          e.load && `${e.load}kg`,
                                          e.rest && `${e.rest}s desc`,
                                        ].filter(Boolean).join(" • ")}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {item.type === "biset" && (
                                  <Badge variant="outline" className="text-[9px] mt-0.5">Bi-set</Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Check-in button */}
                      {!isDone && (
                        <Button className="w-full" onClick={() => handleCheckin(workout.id)} disabled={checkingIn}>
                          <Play className="h-4 w-4 mr-1" />
                          Fazer Check-in
                        </Button>
                      )}
                      {isDone && (
                        <div className="text-center">
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                            <Check className="h-3 w-3 mr-1" /> Concluído
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Orientations dialog */}
      <Dialog open={showOrientations} onOpenChange={setShowOrientations}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Orientações da Jornada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeJourney?.orientations}</p>
        </DialogContent>
      </Dialog>

      <StudentBottomNav />
    </div>
  );
};

export default StudentWorkouts;
