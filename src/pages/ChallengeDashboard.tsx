import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Trophy, Users, Calendar, Flame, Star, CheckCircle, ChevronLeft, ChevronRight, Dumbbell, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Challenge {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  points_per_checkin: number;
  points_weekly_bonus: number;
  points_streak_bonus: number;
  source_journey_id: string | null;
}

interface Participant {
  id: string;
  student_id: string;
  total_points: number;
  joined_at: string;
  student_name: string;
  journey_id: string | null;
}

interface Score {
  id: string;
  participant_id: string;
  score_type: string;
  points: number;
  description: string;
  earned_at: string;
}

interface CheckinDay {
  student_id: string;
  date: string;
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const ChallengeDashboard = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [checkinDays, setCheckinDays] = useState<CheckinDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ranking" | "calendar" | "scores">("ranking");

  useEffect(() => {
    if (challengeId && user) fetchAll();
  }, [challengeId, user]);

  const fetchAll = async () => {
    setLoading(true);

    // Challenge
    const { data: ch } = await supabase
      .from("challenges" as any)
      .select("*")
      .eq("id", challengeId)
      .single();
    if (ch) setChallenge(ch as any);

    // Participants with student names
    const { data: parts } = await supabase
      .from("challenge_participants" as any)
      .select("id, student_id, total_points, joined_at, journey_id")
      .eq("challenge_id", challengeId)
      .order("total_points", { ascending: false });

    if (parts && (parts as any[]).length > 0) {
      const studentIds = (parts as any[]).map((p: any) => p.student_id);
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name")
        .in("id", studentIds);

      const nameMap: Record<string, string> = {};
      (students || []).forEach((s: any) => { nameMap[s.id] = s.full_name; });

      setParticipants((parts as any[]).map((p: any) => ({
        ...p,
        student_name: nameMap[p.student_id] || "Participante",
      })));

      // Fetch checkin days for all participant journeys
      const journeyIds = (parts as any[]).filter((p: any) => p.journey_id).map((p: any) => p.journey_id);
      if (journeyIds.length > 0) {
        const { data: checkins } = await supabase
          .from("workout_checkins")
          .select("student_id, checked_in_at")
          .in("journey_id", journeyIds);

        if (checkins) {
          setCheckinDays(checkins.map((c: any) => ({
            student_id: c.student_id,
            date: (c.checked_in_at as string).slice(0, 10),
          })));
        }
      }
    }

    // Scores log
    const { data: sc } = await supabase
      .from("challenge_scores" as any)
      .select("*")
      .eq("challenge_id", challengeId)
      .order("earned_at", { ascending: false });
    if (sc) setScores(sc as any[]);

    setLoading(false);
  };

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const getMedalIcon = (pos: number) => {
    if (pos === 0) return <span className="text-xl">🥇</span>;
    if (pos === 1) return <span className="text-xl">🥈</span>;
    if (pos === 2) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-bold text-muted-foreground">{pos + 1}º</span>;
  };

  // Calendar logic
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const firstDayOffset = useMemo(() => {
    const d = getDay(startOfMonth(calendarMonth));
    return d === 0 ? 6 : d - 1; // Monday = 0
  }, [calendarMonth]);

  const getCheckinsForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const filtered = selectedParticipant
      ? checkinDays.filter(c => c.date === dateStr && c.student_id === participants.find(p => p.id === selectedParticipant)?.student_id)
      : checkinDays.filter(c => c.date === dateStr);
    // Unique students for that day
    return [...new Set(filtered.map(c => c.student_id))];
  };

  // Stats
  const totalCheckins = scores.filter(s => s.score_type === "checkin").length;
  const totalStreaks = scores.filter(s => s.score_type === "streak").length;
  const totalWeekly = scores.filter(s => s.score_type === "weekly").length;

  const participantScoreBreakdown = useMemo(() => {
    const map: Record<string, { checkin: number; streak: number; weekly: number }> = {};
    scores.forEach(s => {
      if (!map[s.participant_id]) map[s.participant_id] = { checkin: 0, streak: 0, weekly: 0 };
      if (s.score_type === "checkin") map[s.participant_id].checkin += s.points;
      if (s.score_type === "streak") map[s.participant_id].streak += s.points;
      if (s.score_type === "weekly") map[s.participant_id].weekly += s.points;
    });
    return map;
  }, [scores]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!challenge) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Desafio não encontrado</div>;

  const now = new Date();
  const started = new Date(challenge.start_date + "T00:00:00") <= now;
  const ended = new Date(challenge.end_date + "T23:59:59") < now;
  const daysLeft = ended ? 0 : Math.max(0, Math.ceil((new Date(challenge.end_date + "T23:59:59").getTime() - now.getTime()) / 86400000));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-foreground px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/challenges")} className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/60 hover:bg-primary-foreground/15 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-primary-foreground font-display font-bold text-lg tracking-tight">{challenge.name}</h1>
                <p className="text-primary-foreground/40 text-xs">
                  {format(new Date(challenge.start_date + "T12:00:00"), "dd/MM")} - {format(new Date(challenge.end_date + "T12:00:00"), "dd/MM/yyyy")}
                  {ended ? " • Encerrado" : started ? ` • ${daysLeft} dias restantes` : " • Não iniciado"}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${challenge.status === "active" ? "bg-primary-foreground/15 text-primary-foreground/80" : "bg-primary-foreground/5 text-primary-foreground/40"}`}>
              {challenge.status === "active" ? "ATIVO" : "RASCUNHO"}
            </span>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-primary-foreground/5 rounded-xl p-3 text-center">
              <Users className="w-4 h-4 text-primary-foreground/50 mx-auto mb-1" />
              <p className="text-primary-foreground font-display font-bold text-lg">{participants.length}</p>
              <p className="text-primary-foreground/40 text-[10px]">Participantes</p>
            </div>
            <div className="bg-primary-foreground/5 rounded-xl p-3 text-center">
              <CheckCircle className="w-4 h-4 text-primary-foreground/50 mx-auto mb-1" />
              <p className="text-primary-foreground font-display font-bold text-lg">{totalCheckins}</p>
              <p className="text-primary-foreground/40 text-[10px]">Check-ins</p>
            </div>
            <div className="bg-primary-foreground/5 rounded-xl p-3 text-center">
              <Flame className="w-4 h-4 text-primary-foreground/50 mx-auto mb-1" />
              <p className="text-primary-foreground font-display font-bold text-lg">{totalStreaks}</p>
              <p className="text-primary-foreground/40 text-[10px]">Streaks</p>
            </div>
            <div className="bg-primary-foreground/5 rounded-xl p-3 text-center">
              <Star className="w-4 h-4 text-primary-foreground/50 mx-auto mb-1" />
              <p className="text-primary-foreground font-display font-bold text-lg">{totalWeekly}</p>
              <p className="text-primary-foreground/40 text-[10px]">Bônus Semanais</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-6">
          {([
            { key: "ranking" as const, label: "Ranking", icon: Trophy },
            { key: "calendar" as const, label: "Calendário", icon: Calendar },
            { key: "scores" as const, label: "Histórico", icon: TrendingUp },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors ${activeTab === tab.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* RANKING TAB */}
        {activeTab === "ranking" && (
          <div className="space-y-3">
            {participants.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Nenhum participante inscrito ainda</div>
            ) : (
              participants.map((p, i) => {
                const breakdown = participantScoreBreakdown[p.id] || { checkin: 0, streak: 0, weekly: 0 };
                return (
                  <div key={p.id} className={`rounded-xl border p-4 transition-colors ${i < 3 ? "bg-card border-foreground/10" : "bg-card border-border"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex-shrink-0 flex items-center justify-center">{getMedalIcon(i)}</div>
                      <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold text-foreground/70 flex-shrink-0">
                        {getInitials(p.student_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{p.student_name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" /> {breakdown.checkin}pts
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5" /> {breakdown.streak}pts
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Star className="w-2.5 h-2.5" /> {breakdown.weekly}pts
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-display font-bold text-foreground text-lg">{p.total_points}</p>
                        <p className="text-[10px] text-muted-foreground">pontos</p>
                      </div>
                    </div>
                    {/* Progress bar relative to leader */}
                    {participants[0].total_points > 0 && (
                      <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground/30 transition-all"
                          style={{ width: `${Math.max(5, (p.total_points / participants[0].total_points) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === "calendar" && (
          <div>
            {/* Participant filter */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setSelectedParticipant(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!selectedParticipant ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}
              >
                Todos
              </button>
              {participants.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedParticipant(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedParticipant === p.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}
                >
                  {p.student_name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60 hover:bg-secondary/80 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="font-display font-bold text-foreground capitalize">
                  {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
                </h3>
                <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60 hover:bg-secondary/80 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {calendarDays.map(day => {
                  const dayCheckins = getCheckinsForDay(day);
                  const hasCheckins = dayCheckins.length > 0;
                  const isToday = isSameDay(day, new Date());
                  const totalParticipants = participants.length || 1;
                  const intensity = Math.min(1, dayCheckins.length / totalParticipants);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors relative ${
                        isToday ? "ring-2 ring-foreground/20" : ""
                      } ${
                        hasCheckins
                          ? intensity >= 0.7 ? "bg-foreground text-background" : intensity >= 0.3 ? "bg-foreground/40 text-background" : "bg-foreground/15 text-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="font-medium">{format(day, "d")}</span>
                      {hasCheckins && (
                        <span className="text-[8px] font-bold mt-0.5 opacity-80">
                          {selectedParticipant ? `${dayCheckins.length}x` : `${dayCheckins.length}👤`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 justify-center text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-foreground/15" /> Poucos</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-foreground/40" /> Médio</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-foreground" /> Todos</div>
              </div>
            </div>
          </div>
        )}

        {/* SCORES HISTORY TAB */}
        {activeTab === "scores" && (
          <div>
            {scores.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Nenhuma pontuação registrada ainda</div>
            ) : (
              <div className="space-y-2">
                {scores.slice(0, 100).map(s => {
                  const participant = participants.find(p => p.id === s.participant_id);
                  const icon = s.score_type === "checkin" ? <CheckCircle className="w-3.5 h-3.5" />
                    : s.score_type === "streak" ? <Flame className="w-3.5 h-3.5" />
                    : <Star className="w-3.5 h-3.5" />;
                  const typeLabel = s.score_type === "checkin" ? "Check-in" : s.score_type === "streak" ? "Streak" : "Semanal";

                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60 flex-shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{participant?.student_name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{typeLabel} • {s.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-display font-bold text-foreground text-sm">+{s.points}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(s.earned_at), "dd/MM HH:mm")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDashboard;
