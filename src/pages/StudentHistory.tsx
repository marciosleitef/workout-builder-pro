import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentBottomNav from "@/components/StudentBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Flame, Activity, TrendingUp } from "lucide-react";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const StudentHistory = () => {
  const { studentId } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkinDates, setCheckinDates] = useState<Map<string, number>>(new Map());
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weeklyAvg, setWeeklyAvg] = useState(0);

  useEffect(() => {
    if (!studentId) return;
    fetchCheckins();
  }, [studentId, currentMonth]);

  const fetchCheckins = async () => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const [monthRes, recentRes, allRes] = await Promise.all([
      supabase.from("workout_checkins").select("checked_in_at").eq("student_id", studentId!)
        .gte("checked_in_at", start + "T00:00:00").lte("checked_in_at", end + "T23:59:59"),
      supabase.from("workout_checkins").select("*, workouts(name, day_label)").eq("student_id", studentId!)
        .order("checked_in_at", { ascending: false }).limit(10),
      supabase.from("workout_checkins").select("checked_in_at").eq("student_id", studentId!)
        .order("checked_in_at", { ascending: false }).limit(90),
    ]);

    // Build date map
    const dateMap = new Map<string, number>();
    (monthRes.data || []).forEach((c: any) => {
      const d = c.checked_in_at.slice(0, 10);
      dateMap.set(d, (dateMap.get(d) || 0) + 1);
    });
    setCheckinDates(dateMap);
    setMonthTotal(dateMap.size);
    setRecentCheckins(recentRes.data || []);

    // Streak
    const allDays = [...new Set((allRes.data || []).map((c: any) => c.checked_in_at.slice(0, 10)))].sort().reverse();
    let s = 0;
    const today = new Date().toISOString().slice(0, 10);
    if (allDays[0] === today || allDays[0] === format(new Date(Date.now() - 86400000), "yyyy-MM-dd")) {
      s = 1;
      for (let i = 1; i < allDays.length; i++) {
        const diff = (new Date(allDays[i - 1]).getTime() - new Date(allDays[i]).getTime()) / 86400000;
        if (diff <= 1.5) s++;
        else break;
      }
    }
    setStreak(s);

    // Weekly avg
    if (allDays.length > 0) {
      const firstDay = new Date(allDays[allDays.length - 1]);
      const weeks = Math.max(1, Math.ceil((Date.now() - firstDay.getTime()) / (7 * 86400000)));
      setWeeklyAvg(Math.round((allDays.length / weeks) * 10) / 10);
    }
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDay = getDay(startOfMonth(currentMonth));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold font-display">Histórico</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
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
              <p className="text-lg font-bold">{monthTotal}</p>
              <p className="text-[10px] text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{weeklyAvg}</p>
              <p className="text-[10px] text-muted-foreground">Média/sem</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-secondary">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <CardTitle className="text-sm capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                disabled={isSameMonth(currentMonth, new Date())}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const count = checkinDates.get(key) || 0;
                const isToday = key === new Date().toISOString().slice(0, 10);
                return (
                  <div
                    key={key}
                    className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                      count > 0
                        ? count >= 2 ? "bg-green-500 text-white" : "bg-green-500/60 text-white"
                        : isToday ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "text-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent checkins */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Check-ins Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentCheckins.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum check-in registrado</p>
            ) : (
              recentCheckins.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{(c as any).workouts?.name || "Treino"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(c.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <StudentBottomNav />
    </div>
  );
};

export default StudentHistory;
