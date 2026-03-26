import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface StudentScore {
  health: number; // 0-100
  performance: number; // 0-100
  healthBonus: number;
  performanceBonus: number;
  healthBase: number;
  performanceBase: number;
  badges: string[];
  // Detail breakdown
  bioScore: number | null;
  dailyScore: number | null;
  presenceScore: number;
  qualityScore: number;
  bonusDetails: string[];
}

// Healthy ranges for bioimpedance metrics — returns 0-1 how "healthy" the value is
function scoreBMI(v: number | null): number | null {
  if (v == null) return null;
  // Ideal: 18.5-24.9
  if (v >= 18.5 && v <= 24.9) return 1;
  if (v < 18.5) return Math.max(0, 1 - (18.5 - v) / 10);
  return Math.max(0, 1 - (v - 24.9) / 15);
}

function scoreBodyFat(v: number | null, gender?: string | null): number | null {
  if (v == null) return null;
  // Men ideal: 10-20%, Women: 18-28%
  const low = gender === "female" ? 18 : 10;
  const high = gender === "female" ? 28 : 20;
  if (v >= low && v <= high) return 1;
  if (v < low) return Math.max(0, 1 - (low - v) / 15);
  return Math.max(0, 1 - (v - high) / 20);
}

function scoreLeanMassPct(v: number | null, gender?: string | null): number | null {
  if (v == null) return null;
  // Men ideal: 75-90%, Women: 65-80%
  const low = gender === "female" ? 65 : 75;
  const high = gender === "female" ? 80 : 90;
  if (v >= low && v <= high) return 1;
  if (v < low) return Math.max(0, v / low);
  return Math.max(0, 1 - (v - high) / 10);
}

function scoreVisceralFat(v: number | null): number | null {
  if (v == null) return null;
  // <9 ideal, 10-14 high, >15 very high
  if (v <= 9) return 1;
  if (v <= 14) return 0.5;
  return Math.max(0, 1 - (v - 14) / 10);
}

function scoreHydration(v: number | null): number | null {
  if (v == null) return null;
  // Ideal 45-65%
  if (v >= 45 && v <= 65) return 1;
  if (v < 45) return Math.max(0, v / 45);
  return Math.max(0, 1 - (v - 65) / 20);
}

function scoreMuscleMassPct(v: number | null, gender?: string | null): number | null {
  if (v == null) return null;
  const low = gender === "female" ? 30 : 38;
  const high = gender === "female" ? 40 : 50;
  if (v >= low && v <= high) return 1;
  if (v < low) return Math.max(0, v / low);
  return 1; // More muscle is fine
}

function scoreBasalMetabolism(v: number | null, gender?: string | null): number | null {
  if (v == null) return null;
  const ideal = gender === "female" ? 1400 : 1800;
  const ratio = v / ideal;
  if (ratio >= 0.85 && ratio <= 1.3) return 1;
  if (ratio < 0.85) return Math.max(0, ratio / 0.85);
  return Math.max(0, 1 - (ratio - 1.3) / 1);
}

function computeHealthScore(bio: any, gender?: string | null): number | null {
  const scores = [
    scoreBMI(bio.bmi),
    scoreBodyFat(bio.body_fat_pct, gender),
    scoreLeanMassPct(bio.lean_mass_pct, gender),
    scoreVisceralFat(bio.visceral_fat),
    scoreHydration(bio.body_water_pct),
    scoreMuscleMassPct(bio.muscle_mass_pct, gender),
    scoreBasalMetabolism(bio.basal_metabolism, gender),
  ].filter((s): s is number => s !== null);

  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
}

// Score daily health records (student_daily_records)
function scoreDailyHealth(records: any[]): number | null {
  if (records.length === 0) return null;
  const scores: number[] = [];

  // Average across recent records
  const avgVal = (key: string) => {
    const vals = records.map(r => r[key]).filter((v: any) => v != null);
    return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  };

  // BMI: ideal 18.5-24.9
  const bmi = avgVal("bmi");
  if (bmi != null) scores.push(scoreBMI(bmi) ?? 0);

  // Oxygen saturation: ideal 95-100%
  const o2 = avgVal("oxygen_saturation");
  if (o2 != null) scores.push(o2 >= 95 ? 1 : Math.max(0, o2 / 95));

  // Blood pressure: systolic ideal 90-120, diastolic 60-80
  const sys = avgVal("blood_pressure_systolic");
  const dia = avgVal("blood_pressure_diastolic");
  if (sys != null) {
    const sScore = sys >= 90 && sys <= 120 ? 1 : sys < 90 ? sys / 90 : Math.max(0, 1 - (sys - 120) / 60);
    scores.push(sScore);
  }
  if (dia != null) {
    const dScore = dia >= 60 && dia <= 80 ? 1 : dia < 60 ? dia / 60 : Math.max(0, 1 - (dia - 80) / 40);
    scores.push(dScore);
  }

  // Sleep hours: ideal 7-9h
  const sleep = avgVal("sleep_hours");
  if (sleep != null) {
    const slScore = sleep >= 7 && sleep <= 9 ? 1 : sleep < 7 ? Math.max(0, sleep / 7) : Math.max(0, 1 - (sleep - 9) / 4);
    scores.push(slScore);
  }

  // Resting BPM: ideal 50-80
  const bpm = avgVal("resting_bpm");
  if (bpm != null) {
    const bpmScore = bpm >= 50 && bpm <= 80 ? 1 : bpm < 50 ? Math.max(0, bpm / 50) : Math.max(0, 1 - (bpm - 80) / 40);
    scores.push(bpmScore);
  }

  // Hydration level
  const hydrations = records.map(r => r.hydration_level).filter(Boolean);
  if (hydrations.length > 0) {
    const hydMap: Record<string, number> = { "Boa": 1, "Adequada": 0.8, "Moderada": 0.6, "Baixa": 0.3, "Muito Baixa": 0.1 };
    const hScores = hydrations.map((h: string) => hydMap[h] ?? 0.5);
    scores.push(hScores.reduce((a: number, b: number) => a + b, 0) / hScores.length);
  }

  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
}

function getWorkingDaysInMonth(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  let count = 0;
  for (let d = 1; d <= today; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0) count++; // Exclude only Sundays
  }
  return count;
}

function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function useStudentScores(studentIds: string[]) {
  const { user } = useAuth();
  const [scores, setScores] = useState<Record<string, StudentScore>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || studentIds.length === 0) return;
    fetchScores();
  }, [user, studentIds.join(",")]);

  async function fetchScores() {
    setLoading(true);
    const monthStart = getMonthStart();

    // Fetch all data in parallel
    const [bioRes, checkinsRes, feedbackRes, studentsRes, dailyRes] = await Promise.all([
      supabase.from("student_bioimpedance")
        .select("*")
        .in("student_id", studentIds)
        .order("measured_at", { ascending: false }),
      supabase.from("workout_checkins")
        .select("*")
        .in("student_id", studentIds)
        .gte("checked_in_at", monthStart),
      supabase.from("workout_session_feedback")
        .select("*")
        .in("student_id", studentIds)
        .gte("session_date", monthStart),
      supabase.from("students")
        .select("id, gender")
        .in("id", studentIds),
      supabase.from("student_daily_records")
        .select("*")
        .in("student_id", studentIds)
        .order("recorded_at", { ascending: false })
        .limit(100),
    ]);

    const bios = bioRes.data || [];
    const checkins = checkinsRes.data || [];
    const feedbacks = feedbackRes.data || [];
    const dailyRecords = dailyRes.data || [];
    const studentGenders: Record<string, string | null> = {};
    (studentsRes.data || []).forEach((s: any) => { studentGenders[s.id] = s.gender; });

    const workingDays = getWorkingDaysInMonth();
    const now = new Date();
    const result: Record<string, StudentScore> = {};

    for (const sid of studentIds) {
      const gender = studentGenders[sid];
      const badges: string[] = [];
      const bonusDetails: string[] = [];

      // === HEALTH: combine bioimpedance + daily records ===
      const studentBios = bios.filter((b: any) => b.student_id === sid);
      const latestBio = studentBios[0];
      const bioScore = latestBio ? computeHealthScore(latestBio, gender) : null;

      const studentDaily = dailyRecords.filter((r: any) => r.student_id === sid);
      const dailyScore = scoreDailyHealth(studentDaily);

      // Combine: average of available sources
      const healthParts = [bioScore, dailyScore].filter((v): v is number => v !== null);
      let healthBase = healthParts.length > 0 ? Math.round(healthParts.reduce((a, b) => a + b, 0) / healthParts.length) : 0;

      // Health gamification
      let healthBonus = 0;
      // BIA this month
      const biosThisMonth = studentBios.filter((b: any) => b.measured_at >= monthStart);
      if (biosThisMonth.length > 0) {
        healthBonus += 2.5;
        badges.push("bia_month");
      }
      // Improvement between last 2 BIAs
      if (studentBios.length >= 2) {
        const prev = computeHealthScore(studentBios[1], gender);
        const curr = computeHealthScore(studentBios[0], gender);
        if (prev != null && curr != null && curr > prev) {
          healthBonus += 2.5;
          badges.push("bia_improved");
        }
      }

      // === PERFORMANCE ===
      const studentCheckins = checkins.filter((c: any) => c.student_id === sid);
      const studentFeedbacks = feedbacks.filter((f: any) => f.student_id === sid);

      // Frequency: if student trained at all this month, base 50% is guaranteed
      const uniqueDays = new Set(studentCheckins.map((c: any) => c.checked_in_at.slice(0, 10)));
      const hasTrainedThisMonth = uniqueDays.size > 0;
      const presenceScore = hasTrainedThisMonth ? 50 : 0; // 50% just for showing up

      // Training quality (other 50%): from session feedback indicators
      const postFeedbacks = studentFeedbacks.filter((f: any) => f.feedback_type === "post-workout");
      let qualityScore = 0;
      if (postFeedbacks.length > 0) {
        const avgRecovery = avg(postFeedbacks, "post_recovery_scale", 10);
        const avgPSE = avg(postFeedbacks, "perceived_exertion_scale", 10);
        const avgPain = avg(postFeedbacks, "pain_scale_eva", 10);

        // Recovery: higher is better (0-10 → 0-1)
        // PSE: moderate is ideal (4-7 is good training)
        const pseScore = avgPSE != null ? (avgPSE >= 4 && avgPSE <= 7 ? 1 : avgPSE < 4 ? avgPSE / 4 : Math.max(0, 1 - (avgPSE - 7) / 3)) : null;
        // Pain: lower is better (inverted)
        const painScore = avgPain != null ? Math.max(0, 1 - avgPain) : null;

        const qualityParts = [avgRecovery, pseScore, painScore].filter((v): v is number => v !== null);
        qualityScore = qualityParts.length > 0 ? (qualityParts.reduce((a, b) => a + b, 0) / qualityParts.length) * 50 : 0;
      }

      let performanceBase = Math.round(presenceScore + qualityScore);

      // Performance gamification
      let performanceBonus = 0;
      // Complete week without missing (check last 7 days)
      const last7 = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (d.getDay() !== 0) last7.push(d.toISOString().slice(0, 10));
      }
      const last7Trained = last7.filter(d => uniqueDays.has(d));
      if (last7.length > 0 && last7Trained.length === last7.length) {
        performanceBonus += 5;
        badges.push("week_complete");
      }

      // Streak: 3+ consecutive days
      const sortedDays = Array.from(uniqueDays).sort();
      let maxStreak = 0, currentStreak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
        else currentStreak = 1;
      }
      if (maxStreak >= 5) { performanceBonus += 5; badges.push("streak_5"); bonusDetails.push("Streak 5+ dias (+5%)"); }
      else if (maxStreak >= 3) { performanceBonus += 2.5; badges.push("streak_3"); bonusDetails.push("Streak 3+ dias (+2.5%)"); }

      const health = Math.min(100, healthBase + healthBonus);
      const performance = Math.min(100, performanceBase + performanceBonus);

      result[sid] = { health, performance, healthBase, performanceBase, healthBonus, performanceBonus, badges, bioScore: bioScore ?? null, dailyScore: dailyScore ?? null, presenceScore, qualityScore: Math.round(qualityScore), bonusDetails };
    }

    setScores(result);
    setLoading(false);
  }

  return { scores, loading };
}

function avg(arr: any[], key: string, max: number): number | null {
  const vals = arr.map(r => r[key]).filter((v: any) => v != null);
  if (vals.length === 0) return null;
  return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) / max;
}
