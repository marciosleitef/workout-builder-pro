import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentBottomNav from "@/components/StudentBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Heart, Activity, Scale, Droplets, Moon, Gauge, Thermometer, Plus,
  TrendingUp, TrendingDown, Minus, ArrowLeft, ArrowUp, ArrowDown,
  BarChart3, Percent, ChevronRight
} from "lucide-react";
import { useStudentScores } from "@/hooks/useStudentScores";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// ── Bio types ──
interface BioRecord {
  id: string; measured_at: string; weight: number | null; height: number | null;
  bmi: number | null; age: number | null; fat_mass: number | null; body_fat_pct: number | null;
  total_body_water: number | null; water_lean_mass_pct: number | null; hydration_index: number | null;
  water_lean_mass_abs_pct: number | null; intracellular_water: number | null; intracellular_water_pct: number | null;
  extracellular_water: number | null; lean_mass: number | null; lean_mass_pct: number | null;
  muscle_fat_ratio: number | null; muscle_mass: number | null; muscle_mass_pct: number | null;
  basal_metabolism: number | null; phase_angle: number | null; cellular_age: number | null;
  body_water_pct: number | null; bone_mass: number | null; visceral_fat: number | null;
  file_url: string | null; notes: string | null;
}

const FIELD_LABELS: { key: keyof BioRecord; label: string; unit: string }[] = [
  { key: "weight", label: "Peso", unit: "kg" }, { key: "height", label: "Altura", unit: "cm" },
  { key: "bmi", label: "IMC", unit: "" }, { key: "age", label: "Idade", unit: "anos" },
  { key: "fat_mass", label: "Massa Gorda", unit: "kg" }, { key: "body_fat_pct", label: "% Gordura", unit: "%" },
  { key: "total_body_water", label: "Água Corporal Total", unit: "L" },
  { key: "water_lean_mass_pct", label: "Água Corpo/Massa Magra", unit: "%" },
  { key: "hydration_index", label: "Índice Hidratação", unit: "" },
  { key: "intracellular_water", label: "Água Intracelular", unit: "L" },
  { key: "intracellular_water_pct", label: "% Água Intracelular", unit: "%" },
  { key: "extracellular_water", label: "Água Extracelular", unit: "L" },
  { key: "lean_mass", label: "Massa Magra", unit: "kg" }, { key: "lean_mass_pct", label: "% Massa Magra", unit: "%" },
  { key: "muscle_fat_ratio", label: "Razão Músculo/Gordura", unit: "" },
  { key: "muscle_mass", label: "Massa Muscular", unit: "kg" }, { key: "muscle_mass_pct", label: "% Massa Muscular", unit: "%" },
  { key: "basal_metabolism", label: "Taxa Metabol. Basal", unit: "kcal" },
  { key: "phase_angle", label: "Ângulo de Fase", unit: "°" }, { key: "cellular_age", label: "Idade Celular", unit: "anos" },
  { key: "visceral_fat", label: "Gordura Visceral", unit: "" }, { key: "bone_mass", label: "Massa Óssea", unit: "kg" },
];

// ── Human Body Avatar ──
const HumanBody = ({ record, size = "md", gender = "masculino" }: { record: BioRecord; size?: "sm" | "md"; gender?: string }) => {
  const fatPct = record.body_fat_pct ?? 25;
  const musclePct = record.muscle_mass_pct ?? 30;
  const isFemale = gender === "feminino";
  const fatScale = Math.min(1.2, 0.88 + (fatPct / 100) * 0.6);
  const muscleDefinition = Math.max(0, Math.min(1, (musclePct - 20) / 30));
  const w = size === "sm" ? "w-24" : "w-32";
  const h = size === "sm" ? "h-52" : "h-72";
  const skinLight = "hsl(28, 38%, 82%)"; const skinMid = "hsl(25, 35%, 72%)";
  const skinShadow = "hsl(22, 30%, 62%)"; const skinOutline = "hsl(20, 25%, 52%)";
  const fatColor = fatPct > 30 ? "hsl(5, 50%, 58%)" : fatPct > 22 ? "hsl(30, 55%, 56%)" : "hsl(145, 40%, 48%)";
  const muscleColor = musclePct > 35 ? "hsl(145, 50%, 40%)" : musclePct > 25 ? "hsl(170, 40%, 46%)" : "hsl(200, 35%, 52%)";
  const fatOp = 0.15 + (fatPct / 100) * 0.45;
  const muscleOp = 0.1 + muscleDefinition * 0.35;
  const uid = `body-${record.id}`;
  const hipW = isFemale ? 1.15 : 0.95;
  const shoulderW = isFemale ? 0.92 : 1.08;
  const waistW = isFemale ? 0.82 : 0.95;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 480" className={`${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`${uid}-skin`} cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor={skinLight} /><stop offset="70%" stopColor={skinMid} /><stop offset="100%" stopColor={skinShadow} />
          </radialGradient>
          <radialGradient id={`${uid}-fat`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={fatColor} stopOpacity={fatOp * 0.5} /><stop offset="100%" stopColor={fatColor} stopOpacity={fatOp} />
          </radialGradient>
          <linearGradient id={`${uid}-musc`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={muscleColor} stopOpacity={muscleOp * 0.5} /><stop offset="100%" stopColor={muscleColor} stopOpacity={muscleOp} />
          </linearGradient>
        </defs>
        <g transform={`translate(${120 - 120 * fatScale}, 0) scale(${fatScale}, 1)`}>
          <ellipse cx="120" cy="42" rx="28" ry="33" fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.7" />
          <ellipse cx="110" cy="38" rx="3" ry="2" fill={skinShadow} opacity="0.4" />
          <ellipse cx="130" cy="38" rx="3" ry="2" fill={skinShadow} opacity="0.4" />
          <ellipse cx="120" cy="47" rx="4" ry="2.5" fill={skinShadow} opacity="0.2" />
          <path d="M114 54 Q120 58 126 54" fill="none" stroke={skinShadow} strokeWidth="0.6" opacity="0.4" />
          <ellipse cx="92" cy="42" rx="5" ry="9" fill={skinMid} stroke={skinOutline} strokeWidth="0.5" />
          <ellipse cx="148" cy="42" rx="5" ry="9" fill={skinMid} stroke={skinOutline} strokeWidth="0.5" />
          {isFemale && (
            <>
              <path d="M92 28 Q90 15 100 8 Q110 2 120 2 Q130 2 140 8 Q150 15 148 28" fill="none" stroke={skinOutline} strokeWidth="1.5" opacity="0.4" />
              <path d="M90 30 Q88 45 86 58" fill="none" stroke={skinOutline} strokeWidth="1" opacity="0.25" />
              <path d="M150 30 Q152 45 154 58" fill="none" stroke={skinOutline} strokeWidth="1" opacity="0.25" />
            </>
          )}
          <path d={`M108 72 L108 64 Q108 60 110 58 L130 58 Q132 60 132 64 L132 72 L135 85 L105 85 Z`} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.5" />
          <path d={`M105 85 Q${120-40*shoulderW} 86 ${120-52*shoulderW} 98 L${120-55*shoulderW} 108 Q${120-56*shoulderW} 115 ${120-50*shoulderW} 128 L${120-42*waistW} 165 Q${120-38*waistW} 180 ${120-35*waistW} 190 Q${120-40*hipW} 210 ${120-45*hipW} 225 L${120-42*hipW} 238 Q${120-20*hipW} 245 120 248 Q${120+20*hipW} 245 ${120+42*hipW} 238 L${120+45*hipW} 225 Q${120+40*hipW} 210 ${120+35*waistW} 190 Q${120+38*waistW} 180 ${120+42*waistW} 165 L${120+50*shoulderW} 128 Q${120+56*shoulderW} 115 ${120+55*shoulderW} 108 L${120+52*shoulderW} 98 Q${120+40*shoulderW} 86 135 85 Z`} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.8" />
          <path d={`M105 85 Q${120-40*shoulderW} 86 ${120-52*shoulderW} 98 L${120-55*shoulderW} 108 Q${120-56*shoulderW} 115 ${120-50*shoulderW} 128 L${120-42*waistW} 165 Q${120-38*waistW} 180 ${120-35*waistW} 190 Q${120-40*hipW} 210 ${120-45*hipW} 225 L${120-42*hipW} 238 Q${120-20*hipW} 245 120 248 Q${120+20*hipW} 245 ${120+42*hipW} 238 L${120+45*hipW} 225 Q${120+40*hipW} 210 ${120+35*waistW} 190 Q${120+38*waistW} 180 ${120+42*waistW} 165 L${120+50*shoulderW} 128 Q${120+56*shoulderW} 115 ${120+55*shoulderW} 108 L${120+52*shoulderW} 98 Q${120+40*shoulderW} 86 135 85 Z`} fill={`url(#${uid}-fat)`} />
          {isFemale ? (
            <>
              <path d={`M${120-30*shoulderW} 115 Q100 125 120 122 Q140 125 ${120+30*shoulderW} 115`} fill="none" stroke={skinShadow} strokeWidth="0.5" opacity="0.35" />
            </>
          ) : (
            <>
              <path d={`M${120-35*shoulderW} 112 Q105 122 120 118 Q135 122 ${120+35*shoulderW} 112`} fill="none" stroke={skinShadow} strokeWidth="0.4" opacity={0.2+muscleDefinition*0.3} />
              <line x1="120" y1="135" x2="120" y2="200" stroke={skinShadow} strokeWidth="0.3" opacity={muscleDefinition*0.4} />
              {muscleDefinition > 0.3 && (
                <>
                  <path d="M108 148 L132 148" fill="none" stroke={skinShadow} strokeWidth="0.25" opacity={muscleDefinition*0.3} />
                  <path d="M110 165 L130 165" fill="none" stroke={skinShadow} strokeWidth="0.25" opacity={muscleDefinition*0.3} />
                  <path d="M112 182 L128 182" fill="none" stroke={skinShadow} strokeWidth="0.25" opacity={muscleDefinition*0.3} />
                </>
              )}
            </>
          )}
          <ellipse cx="120" cy="195" rx="2.5" ry="3" fill={skinShadow} opacity="0.3" />
          {/* Arms */}
          <path d={`M${120-52*shoulderW} 98 Q${120-62*shoulderW} 100 ${120-66*shoulderW} 112 L${120-72*shoulderW} 150 Q${120-75*shoulderW} 168 ${120-74*shoulderW} 180 L${120-72*shoulderW} 195 Q${120-70*shoulderW} 202 ${120-66*shoulderW} 202 L${120-60*shoulderW} 200 Q${120-56*shoulderW} 198 ${120-56*shoulderW} 192 L${120-55*shoulderW} 165 Q${120-54*shoulderW} 140 ${120-52*shoulderW} 118 Z`} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.6" />
          <path d={`M${120-52*shoulderW} 98 Q${120-62*shoulderW} 100 ${120-66*shoulderW} 112 L${120-72*shoulderW} 150 Q${120-75*shoulderW} 168 ${120-74*shoulderW} 180 L${120-72*shoulderW} 195 Q${120-70*shoulderW} 202 ${120-66*shoulderW} 202 L${120-60*shoulderW} 200 Q${120-56*shoulderW} 198 ${120-56*shoulderW} 192 L${120-55*shoulderW} 165 Q${120-54*shoulderW} 140 ${120-52*shoulderW} 118 Z`} fill={`url(#${uid}-musc)`} />
          <path d={`M${120+52*shoulderW} 98 Q${120+62*shoulderW} 100 ${120+66*shoulderW} 112 L${120+72*shoulderW} 150 Q${120+75*shoulderW} 168 ${120+74*shoulderW} 180 L${120+72*shoulderW} 195 Q${120+70*shoulderW} 202 ${120+66*shoulderW} 202 L${120+60*shoulderW} 200 Q${120+56*shoulderW} 198 ${120+56*shoulderW} 192 L${120+55*shoulderW} 165 Q${120+54*shoulderW} 140 ${120+52*shoulderW} 118 Z`} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.6" />
          <path d={`M${120+52*shoulderW} 98 Q${120+62*shoulderW} 100 ${120+66*shoulderW} 112 L${120+72*shoulderW} 150 Q${120+75*shoulderW} 168 ${120+74*shoulderW} 180 L${120+72*shoulderW} 195 Q${120+70*shoulderW} 202 ${120+66*shoulderW} 202 L${120+60*shoulderW} 200 Q${120+56*shoulderW} 198 ${120+56*shoulderW} 192 L${120+55*shoulderW} 165 Q${120+54*shoulderW} 140 ${120+52*shoulderW} 118 Z`} fill={`url(#${uid}-musc)`} />
        </g>
        {/* Legs */}
        <g>
          <path d={`M${120-32*hipW} 242 Q${120-38*hipW} 250 ${120-40*hipW} 270 L${120-42*hipW} 310 Q${120-42*hipW} 330 ${120-38*hipW} 340 L${120-32*hipW} 342 Q${120-24*hipW} 340 ${120-22*hipW} 335 L${120-18*hipW} 310 Q${120-16*hipW} 280 ${120-18*hipW} 252 Z`} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.6" />
          <path d={`M${120-32*hipW} 242 Q${120-38*hipW} 250 ${120-40*hipW} 270 L${120-42*hipW} 310 Q${120-42*hipW} 330 ${120-38*hipW} 340 L${120-32*hipW} 342 Q${120-24*hipW} 340 ${120-22*hipW} 335 L${120-18*hipW} 310 Q${120-16*hipW} 280 ${120-18*hipW} 252 Z`} fill={`url(#${uid}-musc)`} />
          <path d={`M${120-38*hipW} 342 Q${120-40*hipW} 350 ${120-38*hipW} 370 L${120-36*hipW} 400 Q${120-35*hipW} 415 ${120-32*hipW} 420 L${120-26*hipW} 422 Q${120-22*hipW} 420 ${120-22*hipW} 415 L${120-20*hipW} 400 Q${120-18*hipW} 375 ${120-22*hipW} 342 Z`} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.5" />
          <path d={`M${120-36*hipW} 420 L${120-40*hipW} 430 Q${120-42*hipW} 438 ${120-36*hipW} 440 L${120-20*hipW} 440 Q${120-16*hipW} 438 ${120-18*hipW} 430 L${120-22*hipW} 420 Z`} fill={skinMid} stroke={skinOutline} strokeWidth="0.4" />
          <path d={`M${120+32*hipW} 242 Q${120+38*hipW} 250 ${120+40*hipW} 270 L${120+42*hipW} 310 Q${120+42*hipW} 330 ${120+38*hipW} 340 L${120+32*hipW} 342 Q${120+24*hipW} 340 ${120+22*hipW} 335 L${120+18*hipW} 310 Q${120+16*hipW} 280 ${120+18*hipW} 252 Z`} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.6" />
          <path d={`M${120+32*hipW} 242 Q${120+38*hipW} 250 ${120+40*hipW} 270 L${120+42*hipW} 310 Q${120+42*hipW} 330 ${120+38*hipW} 340 L${120+32*hipW} 342 Q${120+24*hipW} 340 ${120+22*hipW} 335 L${120+18*hipW} 310 Q${120+16*hipW} 280 ${120+18*hipW} 252 Z`} fill={`url(#${uid}-musc)`} />
          <path d={`M${120+38*hipW} 342 Q${120+40*hipW} 350 ${120+38*hipW} 370 L${120+36*hipW} 400 Q${120+35*hipW} 415 ${120+32*hipW} 420 L${120+26*hipW} 422 Q${120+22*hipW} 420 ${120+22*hipW} 415 L${120+20*hipW} 400 Q${120+18*hipW} 375 ${120+22*hipW} 342 Z`} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.5" />
          <path d={`M${120+36*hipW} 420 L${120+40*hipW} 430 Q${120+42*hipW} 438 ${120+36*hipW} 440 L${120+20*hipW} 440 Q${120+16*hipW} 438 ${120+18*hipW} 430 L${120+22*hipW} 420 Z`} fill={skinMid} stroke={skinOutline} strokeWidth="0.4" />
        </g>
        {size === "md" && (
          <>
            {record.body_fat_pct != null && (
              <g>
                <rect x="1" y="168" width="42" height="18" rx="5" fill={fatColor} opacity="0.9" />
                <text x="22" y="180" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui">{record.body_fat_pct}%</text>
                <line x1="43" y1="177" x2="62" y2="177" stroke={fatColor} strokeWidth="1" strokeDasharray="2 2" />
                <text x="22" y="197" textAnchor="middle" fontSize="7" fill={skinOutline} opacity="0.7">gordura</text>
              </g>
            )}
            {record.muscle_mass != null && (
              <g>
                <rect x="196" y="128" width="42" height="18" rx="5" fill={muscleColor} opacity="0.9" />
                <text x="217" y="140" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui">{record.muscle_mass}kg</text>
                <line x1="196" y1="137" x2="178" y2="140" stroke={muscleColor} strokeWidth="1" strokeDasharray="2 2" />
                <text x="217" y="157" textAnchor="middle" fontSize="7" fill={skinOutline} opacity="0.7">músculo</text>
              </g>
            )}
            {record.weight != null && (
              <g>
                <rect x="196" y="82" width="42" height="18" rx="5" fill="hsl(220, 55%, 48%)" opacity="0.9" />
                <text x="217" y="94" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui">{record.weight}kg</text>
                <text x="217" y="111" textAnchor="middle" fontSize="7" fill={skinOutline} opacity="0.7">peso</text>
              </g>
            )}
            {record.lean_mass != null && (
              <g>
                <rect x="1" y="288" width="42" height="18" rx="5" fill="hsl(200, 45%, 48%)" opacity="0.9" />
                <text x="22" y="300" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui">{record.lean_mass}kg</text>
                <line x1="43" y1="297" x2="62" y2="290" stroke="hsl(200, 45%, 48%)" strokeWidth="1" strokeDasharray="2 2" />
                <text x="22" y="317" textAnchor="middle" fontSize="7" fill={skinOutline} opacity="0.7">magra</text>
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  );
};

// ── Diff Badge ──
const DiffBadge = ({ diff }: { diff: number | null }) => {
  if (diff == null || diff === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${diff < 0 ? "text-green-600" : "text-destructive"}`}>
      {diff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(diff).toFixed(1)}
    </span>
  );
};

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg">
      <p className="text-xs font-bold text-foreground mb-1">{payload[0]?.payload?.fullDate || label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

type HealthView = "main" | "bio-detail" | "bio-compare";

const StudentHealth = () => {
  const { user, studentId } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [bioRecords, setBioRecords] = useState<BioRecord[]>([]);
  const [selectedBio, setSelectedBio] = useState<BioRecord | null>(null);
  const [healthView, setHealthView] = useState<HealthView>("main");
  const [showDailyForm, setShowDailyForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const { scores } = useStudentScores(studentId ? [studentId] : []);
  const score = studentId ? scores[studentId] : undefined;

  useEffect(() => {
    if (!studentId) return;
    fetchStudent();
    fetchDailyRecords();
    fetchBioRecords();
    fetchSessionRecords();
  }, [studentId]);

  const fetchStudent = async () => {
    const { data } = await supabase.from("students").select("*").eq("id", studentId!).single();
    setStudent(data);
  };

  const fetchDailyRecords = async () => {
    const { data } = await supabase.from("student_daily_records").select("*").eq("student_id", studentId!)
      .order("recorded_at", { ascending: false }).limit(10);
    setDailyRecords(data || []);
  };

  const fetchBioRecords = async () => {
    const { data } = await supabase.from("student_bioimpedance").select("*").eq("student_id", studentId!)
      .order("measured_at", { ascending: false });
    setBioRecords((data as any[]) || []);
  };

  const saveDailyRecord = async () => {
    if (!studentId || !student) return;
    setSaving(true);
    try {
      const record: any = {
        student_id: studentId, professor_id: student.professor_id,
        weight: formData.weight ? Number(formData.weight) : null,
        height: formData.height ? Number(formData.height) : null,
        blood_pressure_systolic: formData.systolic ? Number(formData.systolic) : null,
        blood_pressure_diastolic: formData.diastolic ? Number(formData.diastolic) : null,
        oxygen_saturation: formData.o2 ? Number(formData.o2) : null,
        sleep_hours: formData.sleep ? Number(formData.sleep) : null,
        resting_bpm: formData.bpm ? Number(formData.bpm) : null,
        hydration_level: formData.hydration || null, notes: formData.notes || null,
      };
      if (record.weight && record.height) {
        const h = record.height / 100;
        record.bmi = Math.round((record.weight / (h * h)) * 10) / 10;
      }
      const { error } = await supabase.from("student_daily_records").insert(record);
      if (error) throw error;
      toast.success("Indicadores registrados!");
      setShowDailyForm(false); setFormData({}); fetchDailyRecords();
    } catch (err: any) { toast.error(err.message || "Erro ao salvar"); } finally { setSaving(false); }
  };

  const getDiff = (a: number | null, b: number | null) => (a != null && b != null ? a - b : null);
  const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  const formatDateShort = (d: string) => { const dt = new Date(d + "T00:00:00"); return `${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear().toString().slice(2)}`; };

  const latest = dailyRecords[0];
  const latestBio = bioRecords[0];
  const gender = student?.gender || "masculino";

  // Chart data
  const chartData = [...bioRecords].reverse().map(r => ({
    date: formatDateShort(r.measured_at), fullDate: formatDate(r.measured_at),
    peso: r.weight, imc: r.bmi, gordura: r.body_fat_pct,
    massaMagra: r.lean_mass, massaMuscular: r.muscle_mass, massaGorda: r.fat_mass,
  }));

  const radarData = (() => {
    if (bioRecords.length < 2) return [];
    const l = bioRecords[0]; const o = bioRecords[bioRecords.length - 1];
    return [
      { subject: "Peso", A: o.weight, B: l.weight }, { subject: "M. Magra", A: o.lean_mass, B: l.lean_mass },
      { subject: "M. Muscular", A: o.muscle_mass, B: l.muscle_mass }, { subject: "M. Gorda", A: o.fat_mass, B: l.fat_mass },
      { subject: "Água", A: o.total_body_water, B: l.total_body_water },
      { subject: "Metabolismo", A: o.basal_metabolism ? o.basal_metabolism/10 : null, B: l.basal_metabolism ? l.basal_metabolism/10 : null },
    ].filter(m => m.A != null && m.B != null);
  })();

  const compareMetrics = [
    { label: "Peso", key: "weight" as keyof BioRecord, unit: "kg", icon: "⚖️" },
    { label: "IMC", key: "bmi" as keyof BioRecord, unit: "", icon: "📊" },
    { label: "% Gordura", key: "body_fat_pct" as keyof BioRecord, unit: "%", icon: "🔥" },
    { label: "Massa Magra", key: "lean_mass" as keyof BioRecord, unit: "kg", icon: "💪" },
    { label: "Massa Muscular", key: "muscle_mass" as keyof BioRecord, unit: "kg", icon: "🏋️" },
    { label: "Massa Gorda", key: "fat_mass" as keyof BioRecord, unit: "kg", icon: "📉" },
    { label: "Metabolismo", key: "basal_metabolism" as keyof BioRecord, unit: "kcal", icon: "⚡" },
    { label: "Água Corporal", key: "total_body_water" as keyof BioRecord, unit: "L", icon: "💧" },
  ];

  // ── BIO DETAIL VIEW ──
  const renderBioDetail = () => {
    if (!selectedBio) return null;
    const idx = bioRecords.findIndex(r => r.id === selectedBio.id);
    const prev = idx >= 0 ? bioRecords[idx + 1] : undefined;
    return (
      <div className="space-y-4">
        <button onClick={() => { setHealthView("main"); setSelectedBio(null); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <p className="font-display font-bold text-foreground text-lg">{formatDate(selectedBio.measured_at)}</p>
        <div className="flex justify-center py-2">
          <HumanBody record={selectedBio} size="md" gender={gender} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_LABELS.map(({ key, label, unit }) => {
            const val = selectedBio[key] as number | null;
            if (val == null) return null;
            const diff = prev ? getDiff(val, prev[key] as number | null) : null;
            return (
              <div key={key} className="bg-secondary/50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{val}{unit && ` ${unit}`}</p>
                  {diff != null && diff !== 0 && <DiffBadge diff={diff} />}
                </div>
              </div>
            );
          })}
        </div>
        {selectedBio.notes && (
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Observações</p>
            <p className="text-sm text-foreground">{selectedBio.notes}</p>
          </div>
        )}
      </div>
    );
  };

  // ── BIO COMPARE VIEW ──
  const renderBioCompare = () => {
    const l = bioRecords[0]; const o = bioRecords[bioRecords.length - 1];
    return (
      <div className="space-y-4">
        <button onClick={() => setHealthView("main")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-center">
          <p className="font-display font-bold text-foreground text-lg">Evolução Corporal</p>
          <p className="text-xs text-muted-foreground">{bioRecords.length} avaliações</p>
        </div>
        {l && o && bioRecords.length >= 2 && (
          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/30 to-card p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">{formatDate(o.measured_at)}</p>
                <p className="text-[9px] text-muted-foreground mb-2">Início</p>
                <HumanBody record={o} size="sm" gender={gender} />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-primary font-bold uppercase mb-1">{formatDate(l.measured_at)}</p>
                <p className="text-[9px] text-primary mb-2">Atual</p>
                <HumanBody record={l} size="sm" gender={gender} />
              </div>
            </div>
          </div>
        )}
        {l && o && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 bg-secondary/70 px-3 py-2">
              <p className="text-[10px] font-bold text-muted-foreground">Métrica</p>
              <p className="text-[10px] font-bold text-muted-foreground text-center">Início</p>
              <p className="text-[10px] font-bold text-muted-foreground text-center">Atual</p>
              <p className="text-[10px] font-bold text-muted-foreground text-right">Diff</p>
            </div>
            {compareMetrics.map(({ label, key, unit, icon }) => {
              const oldVal = o[key] as number | null;
              const newVal = l[key] as number | null;
              if (oldVal == null && newVal == null) return null;
              const diff = getDiff(newVal, oldVal);
              return (
                <div key={key} className="grid grid-cols-4 items-center px-3 py-2 border-t border-border/50">
                  <p className="text-xs text-foreground">{icon} {label}</p>
                  <p className="text-xs text-muted-foreground text-center">{oldVal ?? "—"}{oldVal != null && unit ? ` ${unit}` : ""}</p>
                  <p className="text-xs font-bold text-foreground text-center">{newVal ?? "—"}{newVal != null && unit ? ` ${unit}` : ""}</p>
                  <div className="flex justify-end">{diff != null ? <DiffBadge diff={diff} /> : <span className="text-xs text-muted-foreground">—</span>}</div>
                </div>
              );
            })}
          </div>
        )}
        {radarData.length > 0 && (
          <Card><CardContent className="p-4">
            <p className="text-xs font-bold text-foreground mb-3 text-center">Perfil Corporal</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar name="Início" dataKey="A" stroke="hsl(0, 60%, 55%)" fill="hsl(0, 60%, 55%)" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Atual" dataKey="B" stroke="hsl(150, 55%, 45%)" fill="hsl(150, 55%, 45%)" fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent></Card>
        )}
        {chartData.length >= 2 && (
          <>
            <Card><CardContent className="p-4">
              <p className="text-xs font-bold text-foreground mb-3">Peso & Composição (kg)</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="sPesoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220, 60%, 50%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(220, 60%, 50%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="sGordGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 60%, 55%)" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(0, 60%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="peso" stroke="hsl(220, 60%, 50%)" fill="url(#sPesoGrad)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} name="Peso" />
                    <Area type="monotone" dataKey="massaGorda" stroke="hsl(0, 60%, 55%)" fill="url(#sGordGrad)" strokeWidth={2} dot={{ r: 3 }} name="M. Gorda" />
                    <Line type="monotone" dataKey="massaMagra" stroke="hsl(150, 55%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="M. Magra" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs font-bold text-foreground mb-3">% Gordura & IMC</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="gordura" stroke="hsl(0, 65%, 55%)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} name="% Gordura" />
                    <Line type="monotone" dataKey="imc" stroke="hsl(35, 85%, 50%)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} name="IMC" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs font-bold text-foreground mb-3">Músculo vs Gordura (kg)</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="massaMuscular" fill="hsl(150, 55%, 45%)" radius={[4,4,0,0]} name="Muscular" />
                    <Bar dataKey="massaGorda" fill="hsl(0, 60%, 55%)" radius={[4,4,0,0]} name="Gorda" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent></Card>
          </>
        )}
      </div>
    );
  };

  // ── MAIN VIEW ──
  const renderMain = () => (
    <div className="space-y-4">
      {/* Scores */}
      {score && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium">Score Saúde</span>
              </div>
              <p className="text-2xl font-bold">{score.health}<span className="text-sm text-muted-foreground">/100</span></p>
              <Progress value={score.health} className="h-1.5 mt-2" />
              {score.bonusDetails.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {score.bonusDetails.filter(b => b.includes("BIA") || b.includes("Melhoria")).map((b, i) => (
                    <p key={i} className="text-[9px] text-green-600">✓ {b}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">Score Performance</span>
              </div>
              <p className="text-2xl font-bold">{score.performance}<span className="text-sm text-muted-foreground">/100</span></p>
              <Progress value={score.performance} className="h-1.5 mt-2" />
              {score.bonusDetails.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {score.bonusDetails.filter(b => b.includes("Semana") || b.includes("Streak")).map((b, i) => (
                    <p key={i} className="text-[9px] text-green-600">✓ {b}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bioimpedance Section */}
      {bioRecords.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Bioimpedância
              </CardTitle>
              {bioRecords.length >= 2 && (
                <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => setHealthView("bio-compare")}>
                  <BarChart3 className="h-3 w-3 mr-1" /> Evolução
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Latest avatar */}
            <div className="flex justify-center mb-3">
              <HumanBody record={latestBio!} size="md" gender={gender} />
            </div>
            {/* Bio history */}
            <div className="space-y-2">
              {bioRecords.map((r, idx) => {
                const prev = bioRecords[idx + 1];
                return (
                  <button key={r.id} onClick={() => { setSelectedBio(r); setHealthView("bio-detail"); }}
                    className="w-full rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-all text-left">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <p className="font-display font-bold text-xs">{formatDate(r.measured_at)}</p>
                      </div>
                      {idx === 0 && <Badge variant="secondary" className="text-[9px]">ATUAL</Badge>}
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Peso", value: r.weight, unit: "kg", prev: prev?.weight },
                        { label: "IMC", value: r.bmi, unit: "", prev: prev?.bmi },
                        { label: "Gordura", value: r.body_fat_pct, unit: "%", prev: prev?.body_fat_pct },
                      ].map(({ label, value, unit, prev: prevVal }) => (
                        <div key={label} className="bg-secondary/60 rounded px-2 py-1">
                          <p className="text-[9px] text-muted-foreground">{label}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold">{value != null ? `${value}${unit ? ` ${unit}` : ""}` : "—"}</p>
                            {getDiff(value, prevVal) != null && getDiff(value, prevVal) !== 0 && <DiffBadge diff={getDiff(value, prevVal)} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest daily record */}
      {latest && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Últimos Indicadores</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{format(new Date(latest.recorded_at), "dd/MM/yyyy")}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {latest.weight && (<div className="flex items-center gap-2"><Scale className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Peso</p><p className="text-sm font-semibold">{latest.weight} kg</p></div></div>)}
              {latest.bmi && (<div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">IMC</p><p className="text-sm font-semibold">{latest.bmi}</p></div></div>)}
              {latest.blood_pressure_systolic && (<div className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Pressão</p><p className="text-sm font-semibold">{latest.blood_pressure_systolic}/{latest.blood_pressure_diastolic}</p></div></div>)}
              {latest.oxygen_saturation && (<div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">SpO2</p><p className="text-sm font-semibold">{latest.oxygen_saturation}%</p></div></div>)}
              {latest.sleep_hours && (<div className="flex items-center gap-2"><Moon className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Sono</p><p className="text-sm font-semibold">{latest.sleep_hours}h</p></div></div>)}
              {latest.resting_bpm && (<div className="flex items-center gap-2"><Heart className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">BPM Repouso</p><p className="text-sm font-semibold">{latest.resting_bpm}</p></div></div>)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {dailyRecords.length > 1 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Histórico de Registros</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dailyRecords.slice(1).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground">{format(new Date(r.recorded_at), "dd/MM/yyyy")}</span>
                <div className="flex items-center gap-3 text-xs">
                  {r.weight && <span>{r.weight}kg</span>}
                  {r.blood_pressure_systolic && <span>{r.blood_pressure_systolic}/{r.blood_pressure_diastolic}</span>}
                  {r.sleep_hours && <span>{r.sleep_hours}h sono</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state for bio */}
      {bioRecords.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma avaliação de bioimpedância registrada</p>
            <p className="text-xs text-muted-foreground mt-1">Aguarde seu professor registrar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold font-display">Saúde</h1>
          <Button size="sm" onClick={() => setShowDailyForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Registrar
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {healthView === "main" && renderMain()}
        {healthView === "bio-detail" && renderBioDetail()}
        {healthView === "bio-compare" && renderBioCompare()}
      </div>

      {/* Daily Record Form */}
      <Dialog open={showDailyForm} onOpenChange={setShowDailyForm}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Indicadores</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Peso (kg)</Label><Input type="number" step="0.1" value={formData.weight || ""} onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
              <div><Label className="text-xs">Altura (cm)</Label><Input type="number" value={formData.height || ""} onChange={e => setFormData({...formData, height: e.target.value})} /></div>
              <div><Label className="text-xs">Pressão Sistólica</Label><Input type="number" value={formData.systolic || ""} onChange={e => setFormData({...formData, systolic: e.target.value})} /></div>
              <div><Label className="text-xs">Pressão Diastólica</Label><Input type="number" value={formData.diastolic || ""} onChange={e => setFormData({...formData, diastolic: e.target.value})} /></div>
              <div><Label className="text-xs">SpO2 (%)</Label><Input type="number" value={formData.o2 || ""} onChange={e => setFormData({...formData, o2: e.target.value})} /></div>
              <div><Label className="text-xs">Horas de Sono</Label><Input type="number" step="0.5" value={formData.sleep || ""} onChange={e => setFormData({...formData, sleep: e.target.value})} /></div>
              <div><Label className="text-xs">BPM Repouso</Label><Input type="number" value={formData.bpm || ""} onChange={e => setFormData({...formData, bpm: e.target.value})} /></div>
              <div><Label className="text-xs">Hidratação</Label>
                <Select value={formData.hydration || ""} onValueChange={v => setFormData({...formData, hydration: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Muito Baixa","Baixa","Moderada","Adequada","Boa"].map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Observações</Label><Input value={formData.notes || ""} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <Button className="w-full" onClick={saveDailyRecord} disabled={saving}>{saving ? "Salvando..." : "Salvar Indicadores"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <StudentBottomNav />
    </div>
  );
};

export default StudentHealth;
