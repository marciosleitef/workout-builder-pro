import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import StudentBottomNav from "@/components/StudentBottomNav";
import { Bell, Sun, Moon, LogOut, Droplets, Plus, Minus, Activity, Flame, TrendingUp, Dumbbell, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const DAY_MAP: Record<string, number> = {
  "Segunda": 1, "Terça": 2, "Quarta": 3, "Quinta": 4, "Sexta": 5, "Sábado": 6, "Domingo": 0,
};

const StudentDashboard = () => {
  const { user, signOut, studentId } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState("");
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [journeyName, setJourneyName] = useState("");
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [waterGoal, setWaterGoal] = useState(8);
  const [streak, setStreak] = useState(0);
  const [monthCheckins, setMonthCheckins] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !studentId) return;
    fetchProfile();
    fetchTodayWorkout();
    fetchWater();
    fetchStats();
    fetchNotifications();
  }, [user, studentId]);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user!.id).single();
    setProfileName(data?.full_name || "");
  };

  const fetchTodayWorkout = async () => {
    if (!studentId) return;
    const today = new Date().toISOString().slice(0, 10);
    // Get active journeys
    const { data: journeys } = await supabase
      .from("workout_journeys")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "active")
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!journeys || journeys.length === 0) return;
    const journey = journeys[0];
    setJourneyName(journey.name);

    // Get workouts
    const { data: workouts } = await supabase
      .from("workouts")
      .select("*")
      .eq("journey_id", journey.id)
      .order("sort_order");

    if (!workouts || workouts.length === 0) return;

    // Find today's workout based on format
    const dayOfWeek = new Date().getDay();
    if (journey.format === "semanal") {
      const match = workouts.find((w: any) => {
        const label = w.day_label || "";
        return DAY_MAP[label] === dayOfWeek;
      });
      setTodayWorkout(match || null);
    } else {
      // Numeric/sequential: find next pending workout
      const { data: checkins } = await supabase
        .from("workout_checkins")
        .select("workout_id")
        .eq("student_id", studentId)
        .eq("journey_id", journey.id);
      
      const doneIds = new Set((checkins || []).map((c: any) => c.workout_id));
      const pending = workouts.find((w: any) => !doneIds.has(w.id));
      setTodayWorkout(pending || workouts[0]);
    }
  };

  const fetchWater = async () => {
    if (!studentId) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("water_intake")
      .select("*")
      .eq("student_id", studentId)
      .eq("date", today)
      .maybeSingle();
    
    if (data) {
      setWaterGlasses(data.glasses);
      setWaterGoal(data.goal);
    }
  };

  const updateWater = async (delta: number) => {
    if (!studentId) return;
    const newGlasses = Math.max(0, waterGlasses + delta);
    setWaterGlasses(newGlasses);
    const today = new Date().toISOString().slice(0, 10);
    
    const { data: existing } = await supabase
      .from("water_intake")
      .select("id")
      .eq("student_id", studentId)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      await supabase.from("water_intake").update({ glasses: newGlasses }).eq("id", existing.id);
    } else {
      await supabase.from("water_intake").insert({ student_id: studentId, date: today, glasses: newGlasses, goal: waterGoal });
    }
  };

  const fetchStats = async () => {
    if (!studentId) return;
    const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
    
    const { data: checkins } = await supabase
      .from("workout_checkins")
      .select("checked_in_at")
      .eq("student_id", studentId)
      .gte("checked_in_at", monthStart);

    setMonthCheckins(checkins?.length || 0);

    // Calculate streak
    const { data: allCheckins } = await supabase
      .from("workout_checkins")
      .select("checked_in_at")
      .eq("student_id", studentId)
      .order("checked_in_at", { ascending: false })
      .limit(60);

    if (allCheckins && allCheckins.length > 0) {
      const days = [...new Set(allCheckins.map((c: any) => c.checked_in_at.slice(0, 10)))].sort().reverse();
      let s = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1]);
        const curr = new Date(days[i]);
        const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) s++;
        else break;
      }
      setStreak(s);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n: any) => !n.read).length);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const firstName = profileName.split(" ")[0];
  const waterPct = waterGoal > 0 ? Math.min(100, (waterGlasses / waterGoal) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
            <h1 className="text-lg font-bold font-display text-foreground">Olá, {firstName}! 💪</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-secondary">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    Notificações
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllRead}>Marcar lidas</Button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-3 rounded-lg border ${n.read ? "bg-card" : "bg-primary/5 border-primary/20"}`}>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "dd/MM HH:mm")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <button onClick={signOut} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Today's Workout Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Treino de Hoje</CardTitle>
              {journeyName && <Badge variant="secondary" className="text-[10px]">{journeyName}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {todayWorkout ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{todayWorkout.name}</p>
                    <p className="text-xs text-muted-foreground">{todayWorkout.day_label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate("/student-workouts")}
                >
                  Iniciar Treino
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum treino programado para hoje</p>
                <Button variant="outline" className="mt-2" onClick={() => navigate("/student-workouts")}>
                  Ver Todos os Treinos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{streak}</p>
              <p className="text-[10px] text-muted-foreground">Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Activity className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{monthCheckins}</p>
              <p className="text-[10px] text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{Math.round(waterPct)}%</p>
              <p className="text-[10px] text-muted-foreground">Hidratação</p>
            </CardContent>
          </Card>
        </div>

        {/* Water Intake Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Consumo de Água
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => updateWater(-1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1">
                <div className="flex items-baseline gap-1 justify-center mb-1">
                  <span className="text-2xl font-bold">{waterGlasses}</span>
                  <span className="text-sm text-muted-foreground">/ {waterGoal} copos</span>
                </div>
                <Progress value={waterPct} className="h-2" />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => updateWater(1)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {/* Glass icons */}
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {Array.from({ length: waterGoal }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const newVal = i + 1 === waterGlasses ? i : i + 1;
                    const delta = newVal - waterGlasses;
                    updateWater(delta);
                  }}
                  className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${
                    i < waterGlasses ? "bg-blue-500 text-white" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Droplets className="h-3 w-3" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/student-health")}>
                <Activity className="h-4 w-4" />
                <span className="text-xs">Indicadores Diários</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/student-challenges")}>
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Meus Desafios</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <StudentBottomNav />
    </div>
  );
};

export default StudentDashboard;
