import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface CheckinRecord {
  id: string;
  student_id: string;
  journey_id: string;
  workout_id: string;
  checked_in_at: string;
  notes: string;
  student_name?: string;
  journey_name?: string;
  workout_name?: string;
}

const AttendanceCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [journeys, setJourneys] = useState<{ id: string; name: string }[]>([]);
  const [workouts, setWorkouts] = useState<{ id: string; name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const [checkinsRes, studentsRes, journeysRes, workoutsRes] = await Promise.all([
      supabase.from("workout_checkins").select("*").gte("checked_in_at", monthStart).lte("checked_in_at", monthEnd + "T23:59:59"),
      supabase.from("students").select("id, full_name"),
      supabase.from("workout_journeys").select("id, name"),
      supabase.from("workouts").select("id, name"),
    ]);

    setCheckins(checkinsRes.data || []);
    setStudents(studentsRes.data || []);
    setJourneys(journeysRes.data || []);
    setWorkouts(workoutsRes.data || []);
    setLoading(false);
  };

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s.full_name])), [students]);
  const journeyMap = useMemo(() => new Map(journeys.map((j) => [j.id, j.name])), [journeys]);
  const workoutMap = useMemo(() => new Map(workouts.map((w) => [w.id, w.name])), [workouts]);

  // Group check-ins by date string
  const checkinsByDate = useMemo(() => {
    const map = new Map<string, CheckinRecord[]>();
    for (const c of checkins) {
      const dateKey = format(new Date(c.checked_in_at), "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(c);
    }
    return map;
  }, [checkins]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Pad start of month to align with weekday
  const startPadding = getDay(startOfMonth(currentMonth));
  // Sunday = 0, adjust to Monday-first: (day + 6) % 7
  const paddingDays = (startPadding === 0 ? 6 : startPadding - 1);

  const selectedDateCheckins = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return (checkinsByDate.get(key) || []).map((c) => ({
      ...c,
      student_name: studentMap.get(c.student_id) || "Aluno",
      journey_name: journeyMap.get(c.journey_id) || "Jornada",
      workout_name: workoutMap.get(c.workout_id) || "Treino",
    }));
  }, [selectedDate, checkinsByDate, studentMap, journeyMap, workoutMap]);

  const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-foreground px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/60 hover:bg-primary-foreground/15 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display font-bold text-lg text-primary-foreground">Calendário de Frequência</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display font-bold text-xl text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Calendar grid */}
            <div className="bg-card rounded-2xl border border-border p-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty padding cells */}
                {Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}

                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayCheckins = checkinsByDate.get(key) || [];
                  const hasCheckins = dayCheckins.length > 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative
                        ${hasCheckins ? "bg-[hsl(150,55%,45%)]/15 text-[hsl(150,55%,45%)] hover:bg-[hsl(150,55%,45%)]/25" : "text-foreground hover:bg-secondary"}
                        ${isSelected ? "ring-2 ring-primary shadow-md" : ""}
                        ${isToday ? "font-bold" : ""}
                      `}
                    >
                      <span>{format(day, "d")}</span>
                      {hasCheckins && (
                        <span className="text-[9px] font-bold mt-0.5">{dayCheckins.length}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-center">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-4 rounded bg-[hsl(150,55%,45%)]/20" />
                <span>Dias com treinos</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-4 rounded bg-secondary" />
                <span>Sem treinos</span>
              </div>
            </div>

            {/* Expanded day detail */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 bg-card rounded-2xl border border-border p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-foreground">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <button onClick={() => setSelectedDate(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedDateCheckins.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum treino registrado neste dia.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateCheckins.map((c) => (
                        <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                          <CheckCircle2 className="w-5 h-5 text-[hsl(150,55%,45%)] mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-sm text-foreground">{c.student_name}</p>
                            <p className="text-xs text-muted-foreground">{c.journey_name} → {c.workout_name}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {format(new Date(c.checked_in_at), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
