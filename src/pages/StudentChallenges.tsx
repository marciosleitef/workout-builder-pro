import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentBottomNav from "@/components/StudentBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, Medal, Crown, Flame, Star, ChevronRight } from "lucide-react";

const POSITION_ICONS = [Crown, Medal, Star];
const POSITION_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];

const StudentChallenges = () => {
  const { studentId } = useAuth();
  const [participations, setParticipations] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [myScores, setMyScores] = useState<any[]>([]);

  useEffect(() => {
    if (!studentId) return;
    fetchParticipations();
  }, [studentId]);

  const fetchParticipations = async () => {
    const { data } = await supabase
      .from("challenge_participants")
      .select("*, challenges(*)")
      .eq("student_id", studentId!);

    if (data) {
      // Fetch rankings for each challenge
      const enriched = await Promise.all(
        data.map(async (p: any) => {
          const { data: participants } = await supabase
            .from("challenge_participants")
            .select("*, students(full_name)")
            .eq("challenge_id", p.challenge_id)
            .order("total_points", { ascending: false });

          const myPos = (participants || []).findIndex((pp: any) => pp.student_id === studentId) + 1;
          return { ...p, position: myPos, totalParticipants: participants?.length || 0 };
        })
      );
      setParticipations(enriched);
    }
  };

  const openChallenge = async (participation: any) => {
    setSelectedChallenge(participation);

    const [rankRes, scoresRes] = await Promise.all([
      supabase.from("challenge_participants")
        .select("*, students(full_name)")
        .eq("challenge_id", participation.challenge_id)
        .order("total_points", { ascending: false }),
      supabase.from("challenge_scores")
        .select("*")
        .eq("participant_id", participation.id)
        .order("earned_at", { ascending: false })
        .limit(30),
    ]);

    setRanking(rankRes.data || []);
    setMyScores(scoresRes.data || []);
  };

  const getStatusBadge = (challenge: any) => {
    if (challenge.status === "active") return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px]">Ativo</Badge>;
    if (challenge.status === "ended") return <Badge variant="secondary" className="text-[10px]">Encerrado</Badge>;
    return <Badge variant="outline" className="text-[10px]">{challenge.status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold font-display">Meus Desafios</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {participations.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Você não está em nenhum desafio</p>
            <p className="text-xs text-muted-foreground mt-1">Peça ao seu professor o link de um desafio</p>
          </div>
        ) : (
          participations.map((p) => {
            const challenge = p.challenges;
            const PositionIcon = POSITION_ICONS[Math.min(p.position - 1, 2)] || Star;
            const posColor = p.position <= 3 ? POSITION_COLORS[p.position - 1] : "text-muted-foreground";

            return (
              <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openChallenge(p)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <PositionIcon className={`h-5 w-5 ${posColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{challenge.name}</p>
                        {getStatusBadge(challenge)}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">#{p.position} de {p.totalParticipants}</span>
                        <span className="text-xs font-semibold">{p.total_points} pts</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(challenge.start_date), "dd/MM")} - {format(new Date(challenge.end_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Challenge Detail */}
      <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedChallenge?.challenges?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-2">
              {/* My stats */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedChallenge?.position}°</p>
                  <p className="text-[10px] text-muted-foreground">Posição</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedChallenge?.total_points}</p>
                  <p className="text-[10px] text-muted-foreground">Pontos</p>
                </div>
              </div>

              {/* Ranking */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Ranking</h3>
                {ranking.map((r: any, i: number) => {
                  const isMe = r.student_id === studentId;
                  return (
                    <div key={r.id} className={`flex items-center gap-3 py-2 px-2 rounded-lg ${isMe ? "bg-primary/10" : ""}`}>
                      <span className={`text-sm font-bold w-6 text-center ${i < 3 ? POSITION_COLORS[i] : "text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <p className={`text-xs flex-1 truncate ${isMe ? "font-bold" : ""}`}>
                        {r.students?.full_name || "Participante"}
                        {isMe && " (você)"}
                      </p>
                      <span className="text-xs font-semibold">{r.total_points} pts</span>
                    </div>
                  );
                })}
              </div>

              {/* Score history */}
              {myScores.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Seus Pontos</h3>
                  {myScores.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-xs">{s.description || s.score_type}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(s.earned_at), "dd/MM HH:mm")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">+{s.points}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <StudentBottomNav />
    </div>
  );
};

export default StudentChallenges;
