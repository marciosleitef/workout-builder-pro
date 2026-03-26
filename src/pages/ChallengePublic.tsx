import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Calendar, Users, Medal, Flame, CheckCircle, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Challenge {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  professor_id: string;
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
  student_name?: string;
}

const ChallengePublic = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupWhatsapp, setSignupWhatsapp] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (inviteCode) fetchChallenge();
  }, [inviteCode]);

  const fetchChallenge = async () => {
    setLoading(true);
    const { data: challengeData } = await supabase
      .from("challenges" as any)
      .select("*")
      .eq("invite_code", inviteCode)
      .single();

    if (!challengeData) {
      setLoading(false);
      return;
    }
    setChallenge(challengeData as any);

    // Fetch participants with student names
    const { data: parts } = await supabase
      .from("challenge_participants" as any)
      .select("id, student_id, total_points, joined_at")
      .eq("challenge_id", challengeData.id)
      .order("total_points", { ascending: false });

    if (parts && parts.length > 0) {
      const studentIds = parts.map((p: any) => p.student_id);
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name")
        .in("id", studentIds);

      const nameMap: Record<string, string> = {};
      (students || []).forEach((s: any) => { nameMap[s.id] = s.full_name; });

      setParticipants(parts.map((p: any) => ({
        ...p,
        student_name: nameMap[p.student_id] || "Participante",
      })));
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!signupName.trim() || !signupEmail.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    if (!challenge) return;

    setSignupLoading(true);

    // Check if student already exists for this professor
    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("professor_id", challenge.professor_id)
      .eq("email", signupEmail.trim().toLowerCase())
      .maybeSingle();

    let studentId: string;

    if (existingStudent) {
      studentId = existingStudent.id;
    } else {
      // Create new student
      const { data: newStudent, error: studentErr } = await supabase
        .from("students")
        .insert({
          full_name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          whatsapp: signupWhatsapp.trim() || null,
          professor_id: challenge.professor_id,
          status: "active",
        })
        .select("id")
        .single();

      if (studentErr || !newStudent) {
        toast.error("Erro ao se inscrever. Tente novamente.");
        setSignupLoading(false);
        return;
      }
      studentId = newStudent.id;
    }

    // Check if already enrolled
    const { data: existingPart } = await supabase
      .from("challenge_participants" as any)
      .select("id")
      .eq("challenge_id", challenge.id)
      .eq("student_id", studentId)
      .maybeSingle();

    if (existingPart) {
      toast.info("Você já está inscrito neste desafio!");
      setSignupLoading(false);
      setSignupSuccess(true);
      return;
    }

    // If challenge has source journey, copy it for the participant
    let journeyId: string | null = null;
    if (challenge.source_journey_id) {
      // Get source journey
      const { data: sourceJourney } = await supabase
        .from("workout_journeys")
        .select("*")
        .eq("id", challenge.source_journey_id)
        .single();

      if (sourceJourney) {
        const { data: newJourney } = await supabase
          .from("workout_journeys")
          .insert({
            name: `${challenge.name} - ${signupName.trim()}`,
            professor_id: challenge.professor_id,
            student_id: studentId,
            start_date: challenge.start_date,
            end_date: challenge.end_date,
            objective: (sourceJourney as any).objective,
            level: (sourceJourney as any).level,
            format: (sourceJourney as any).format,
            orientations: (sourceJourney as any).orientations,
            status: "active",
          })
          .select("id")
          .single();

        if (newJourney) {
          journeyId = newJourney.id;

          // Copy workouts from source journey
          const { data: sourceWorkouts } = await supabase
            .from("workouts")
            .select("*")
            .eq("journey_id", challenge.source_journey_id);

          if (sourceWorkouts && sourceWorkouts.length > 0) {
            const workoutInserts = sourceWorkouts.map((w: any) => ({
              journey_id: journeyId!,
              professor_id: challenge.professor_id,
              student_id: studentId,
              name: w.name,
              day_label: w.day_label,
              exercises_data: w.exercises_data,
              orientations: w.orientations,
              sort_order: w.sort_order,
            }));
            await supabase.from("workouts").insert(workoutInserts);
          }
        }
      }
    }

    // Add participant
    const { error: partErr } = await supabase
      .from("challenge_participants" as any)
      .insert({
        challenge_id: challenge.id,
        student_id: studentId,
        journey_id: journeyId,
      });

    if (partErr) {
      toast.error("Erro ao inscrever no desafio.");
      setSignupLoading(false);
      return;
    }

    toast.success("Inscrição realizada com sucesso!");
    setSignupSuccess(true);
    setSignupLoading(false);
    fetchChallenge();
  };

  const getMedalIcon = (pos: number) => {
    if (pos === 0) return <span className="text-lg">🥇</span>;
    if (pos === 1) return <span className="text-lg">🥈</span>;
    if (pos === 2) return <span className="text-lg">🥉</span>;
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{pos + 1}º</span>;
  };

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const isActive = challenge?.status === "active";
  const now = new Date();
  const started = challenge ? new Date(challenge.start_date + "T00:00:00") <= now : false;
  const ended = challenge ? new Date(challenge.end_date + "T23:59:59") < now : false;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;

  if (!challenge) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-foreground font-display font-bold text-lg">Desafio não encontrado</p>
        <p className="text-muted-foreground text-sm mt-1">Verifique o link e tente novamente.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-foreground px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Trophy className="w-10 h-10 text-primary-foreground/60 mx-auto mb-3" />
          <h1 className="text-primary-foreground font-display font-bold text-2xl tracking-tight">{challenge.name}</h1>
          {challenge.description && <p className="text-primary-foreground/50 text-sm mt-2 max-w-md mx-auto">{challenge.description}</p>}
          <div className="flex items-center justify-center gap-6 mt-4 text-primary-foreground/40 text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(challenge.start_date + "T12:00:00"), "dd/MM")} - {format(new Date(challenge.end_date + "T12:00:00"), "dd/MM/yy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {participants.length} inscritos
            </span>
          </div>
          {ended && <span className="inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground">ENCERRADO</span>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Points info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <CheckCircle className="w-5 h-5 text-foreground/60 mx-auto mb-1" />
            <p className="font-display font-bold text-foreground text-lg">{challenge.points_per_checkin}</p>
            <p className="text-[10px] text-muted-foreground">pts por treino</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Star className="w-5 h-5 text-foreground/60 mx-auto mb-1" />
            <p className="font-display font-bold text-foreground text-lg">{challenge.points_weekly_bonus}</p>
            <p className="text-[10px] text-muted-foreground">bônus semanal</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Flame className="w-5 h-5 text-foreground/60 mx-auto mb-1" />
            <p className="font-display font-bold text-foreground text-lg">{challenge.points_streak_bonus}</p>
            <p className="text-[10px] text-muted-foreground">pts por streak</p>
          </div>
        </div>

        {/* Signup or Ranking */}
        {!signupSuccess && !ended && (
          <div className="rounded-2xl border border-border bg-card p-6">
            {!showSignup ? (
              <button onClick={() => setShowSignup(true)} className="w-full py-3.5 rounded-xl bg-foreground text-background font-display font-bold text-sm hover:opacity-90 transition-opacity">
                Quero participar! 🚀
              </button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-foreground">Inscrição</h3>
                <div>
                  <label className="text-sm font-medium text-foreground">Nome completo *</label>
                  <input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">E-mail *</label>
                  <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">WhatsApp (opcional)</label>
                  <input value={signupWhatsapp} onChange={(e) => setSignupWhatsapp(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="(11) 99999-9999" />
                </div>
                <button onClick={handleSignup} disabled={signupLoading} className="w-full py-3 rounded-lg bg-foreground text-background font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {signupLoading ? "Inscrevendo..." : "Confirmar Inscrição"}
                </button>
              </div>
            )}
          </div>
        )}

        {signupSuccess && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <CheckCircle className="w-10 h-10 text-foreground/60 mx-auto mb-2" />
            <p className="font-display font-bold text-foreground">Inscrição confirmada!</p>
            <p className="text-sm text-muted-foreground mt-1">Você está no desafio. Boa sorte! 💪</p>
          </div>
        )}

        {/* Ranking */}
        <div>
          <h2 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Ranking
          </h2>
          {participants.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhum participante ainda</div>
          ) : (
            <div className="space-y-2">
              {participants.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${i < 3 ? "bg-card border-foreground/10" : "bg-card border-border"}`}>
                  <div className="w-8 flex-shrink-0 flex items-center justify-center">{getMedalIcon(i)}</div>
                  <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold text-foreground/70 flex-shrink-0">
                    {getInitials(p.student_name || "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{p.student_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-foreground">{p.total_points}</p>
                    <p className="text-[10px] text-muted-foreground">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengePublic;
