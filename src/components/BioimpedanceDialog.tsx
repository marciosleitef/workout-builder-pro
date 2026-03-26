import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Upload, TrendingUp, ArrowLeft, BarChart3, Scale, Percent, Activity, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

interface BioRecord {
  id: string;
  measured_at: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  age: number | null;
  fat_mass: number | null;
  body_fat_pct: number | null;
  total_body_water: number | null;
  water_lean_mass_pct: number | null;
  hydration_index: number | null;
  water_lean_mass_abs_pct: number | null;
  intracellular_water: number | null;
  intracellular_water_pct: number | null;
  extracellular_water: number | null;
  lean_mass: number | null;
  lean_mass_pct: number | null;
  muscle_fat_ratio: number | null;
  muscle_mass: number | null;
  muscle_mass_pct: number | null;
  basal_metabolism: number | null;
  phase_angle: number | null;
  cellular_age: number | null;
  body_water_pct: number | null;
  bone_mass: number | null;
  visceral_fat: number | null;
  file_url: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  gender?: string;
}

const FIELD_LABELS: { key: keyof BioRecord; label: string; unit: string }[] = [
  { key: "weight", label: "Peso", unit: "kg" },
  { key: "height", label: "Altura", unit: "cm" },
  { key: "bmi", label: "IMC", unit: "" },
  { key: "age", label: "Idade", unit: "anos" },
  { key: "fat_mass", label: "Massa Gorda", unit: "kg" },
  { key: "body_fat_pct", label: "% Gordura", unit: "%" },
  { key: "total_body_water", label: "Água Corporal Total", unit: "L" },
  { key: "water_lean_mass_pct", label: "Água Corpo/Massa Magra", unit: "%" },
  { key: "hydration_index", label: "Índice Hidratação", unit: "" },
  { key: "water_lean_mass_abs_pct", label: "Água Massa Magra", unit: "%" },
  { key: "intracellular_water", label: "Água Intracelular", unit: "L" },
  { key: "intracellular_water_pct", label: "% Água Intracelular", unit: "%" },
  { key: "extracellular_water", label: "Água Extracelular", unit: "L" },
  { key: "lean_mass", label: "Massa Magra", unit: "kg" },
  { key: "lean_mass_pct", label: "% Massa Magra", unit: "%" },
  { key: "muscle_fat_ratio", label: "Razão Músculo/Gordura", unit: "" },
  { key: "muscle_mass", label: "Massa Muscular", unit: "kg" },
  { key: "muscle_mass_pct", label: "% Massa Muscular", unit: "%" },
  { key: "basal_metabolism", label: "Taxa Metabol. Basal", unit: "kcal" },
  { key: "phase_angle", label: "Ângulo de Fase", unit: "°" },
  { key: "cellular_age", label: "Idade Celular", unit: "anos" },
  { key: "visceral_fat", label: "Gordura Visceral", unit: "" },
  { key: "bone_mass", label: "Massa Óssea", unit: "kg" },
];

const NUMERIC_KEYS = FIELD_LABELS.map(f => f.key);

type View = "main" | "form" | "detail" | "compare";

/* ── Anatomical Human Body SVG ── */
const HumanBody = ({ record, size = "md", gender = "masculino" }: { record: BioRecord; size?: "sm" | "md"; gender?: string }) => {
  const fatPct = record.body_fat_pct ?? 25;
  const musclePct = record.muscle_mass_pct ?? 30;
  const isFemale = gender === "feminino";

  // Dynamic proportions based on body composition
  const fatScale = Math.min(1.2, 0.88 + (fatPct / 100) * 0.6);
  const muscleDefinition = Math.max(0, Math.min(1, (musclePct - 20) / 30));
  const w = size === "sm" ? "w-24" : "w-32";
  const h = size === "sm" ? "h-52" : "h-72";

  // Anatomical color palette
  const skinLight = "hsl(28, 38%, 82%)";
  const skinMid = "hsl(25, 35%, 72%)";
  const skinShadow = "hsl(22, 30%, 62%)";
  const skinOutline = "hsl(20, 25%, 52%)";
  const fatColor = fatPct > 30 ? "hsl(5, 50%, 58%)" : fatPct > 22 ? "hsl(30, 55%, 56%)" : "hsl(145, 40%, 48%)";
  const muscleColor = musclePct > 35 ? "hsl(145, 50%, 40%)" : musclePct > 25 ? "hsl(170, 40%, 46%)" : "hsl(200, 35%, 52%)";
  const fatOp = 0.15 + (fatPct / 100) * 0.45;
  const muscleOp = 0.1 + muscleDefinition * 0.35;

  const uid = `body-${record.id}`;

  // Hip width differs by gender
  const hipW = isFemale ? 1.15 : 0.95;
  // Shoulder width differs
  const shoulderW = isFemale ? 0.92 : 1.08;
  // Waist differs
  const waistW = isFemale ? 0.82 : 0.95;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 480" className={`${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`${uid}-skin`} cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor={skinLight} />
            <stop offset="70%" stopColor={skinMid} />
            <stop offset="100%" stopColor={skinShadow} />
          </radialGradient>
          <radialGradient id={`${uid}-fat`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={fatColor} stopOpacity={fatOp * 0.5} />
            <stop offset="100%" stopColor={fatColor} stopOpacity={fatOp} />
          </radialGradient>
          <linearGradient id={`${uid}-musc`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={muscleColor} stopOpacity={muscleOp * 0.5} />
            <stop offset="100%" stopColor={muscleColor} stopOpacity={muscleOp} />
          </linearGradient>
          <linearGradient id={`${uid}-depth`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={skinShadow} stopOpacity="0.2" />
            <stop offset="50%" stopColor={skinShadow} stopOpacity="0" />
            <stop offset="100%" stopColor={skinShadow} stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <g transform={`translate(${120 - 120 * fatScale}, 0) scale(${fatScale}, 1)`}>
          {/* ── HEAD ── */}
          <ellipse cx="120" cy="42" rx="28" ry="33" fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.7" />
          {/* Face features */}
          <ellipse cx="110" cy="38" rx="3" ry="2" fill={skinShadow} opacity="0.4" />
          <ellipse cx="130" cy="38" rx="3" ry="2" fill={skinShadow} opacity="0.4" />
          <ellipse cx="120" cy="47" rx="4" ry="2.5" fill={skinShadow} opacity="0.2" />
          <path d="M114 54 Q120 58 126 54" fill="none" stroke={skinShadow} strokeWidth="0.6" opacity="0.4" />
          {/* Ears */}
          <ellipse cx="92" cy="42" rx="5" ry="9" fill={skinMid} stroke={skinOutline} strokeWidth="0.5" />
          <ellipse cx="148" cy="42" rx="5" ry="9" fill={skinMid} stroke={skinOutline} strokeWidth="0.5" />
          {isFemale && (
            <>
              {/* Hair suggestion for female */}
              <path d="M92 28 Q90 15 100 8 Q110 2 120 2 Q130 2 140 8 Q150 15 148 28"
                fill="none" stroke={skinOutline} strokeWidth="1.5" opacity="0.4" />
              <path d="M90 30 Q88 45 86 58" fill="none" stroke={skinOutline} strokeWidth="1" opacity="0.25" />
              <path d="M150 30 Q152 45 154 58" fill="none" stroke={skinOutline} strokeWidth="1" opacity="0.25" />
            </>
          )}

          {/* ── NECK ── */}
          <path d={`M${108} 72 L${108} 64 Q${108} 60 ${110} 58 L${130} 58 Q${132} 60 ${132} 64 L${132} 72 
                    L${135} 85 L${105} 85 Z`}
            fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.5" />
          {/* Neck muscle lines */}
          <path d="M112 64 L108 78" fill="none" stroke={skinShadow} strokeWidth="0.3" opacity={muscleDefinition * 0.5} />
          <path d="M128 64 L132 78" fill="none" stroke={skinShadow} strokeWidth="0.3" opacity={muscleDefinition * 0.5} />

          {/* ── SHOULDERS + TORSO ── */}
          <path d={`
            M105 85
            Q${120 - 40 * shoulderW} 86 ${120 - 52 * shoulderW} 98
            L${120 - 55 * shoulderW} 108
            Q${120 - 56 * shoulderW} 115 ${120 - 50 * shoulderW} 128
            L${120 - 42 * waistW} 165
            Q${120 - 38 * waistW} 180 ${120 - 35 * waistW} 190
            Q${120 - 40 * hipW} 210 ${120 - 45 * hipW} 225
            L${120 - 42 * hipW} 238
            Q${120 - 20 * hipW} 245 120 248
            Q${120 + 20 * hipW} 245 ${120 + 42 * hipW} 238
            L${120 + 45 * hipW} 225
            Q${120 + 40 * hipW} 210 ${120 + 35 * waistW} 190
            Q${120 + 38 * waistW} 180 ${120 + 42 * waistW} 165
            L${120 + 50 * shoulderW} 128
            Q${120 + 56 * shoulderW} 115 ${120 + 55 * shoulderW} 108
            L${120 + 52 * shoulderW} 98
            Q${120 + 40 * shoulderW} 86 135 85
            Z
          `} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.8" />

          {/* Depth shading on torso */}
          <path d={`
            M105 85 Q${120 - 40 * shoulderW} 86 ${120 - 52 * shoulderW} 98
            L${120 - 55 * shoulderW} 108 Q${120 - 56 * shoulderW} 115 ${120 - 50 * shoulderW} 128
            L${120 - 42 * waistW} 165 Q${120 - 38 * waistW} 180 ${120 - 35 * waistW} 190
            Q${120 - 40 * hipW} 210 ${120 - 45 * hipW} 225 L${120 - 42 * hipW} 238
            Q${120 - 20 * hipW} 245 120 248
            Q${120 + 20 * hipW} 245 ${120 + 42 * hipW} 238
            L${120 + 45 * hipW} 225 Q${120 + 40 * hipW} 210 ${120 + 35 * waistW} 190
            Q${120 + 38 * waistW} 180 ${120 + 42 * waistW} 165
            L${120 + 50 * shoulderW} 128 Q${120 + 56 * shoulderW} 115 ${120 + 55 * shoulderW} 108
            L${120 + 52 * shoulderW} 98 Q${120 + 40 * shoulderW} 86 135 85 Z
          `} fill={`url(#${uid}-fat)`} />

          {/* Anatomical detail lines */}
          {isFemale ? (
            <>
              {/* Bust line */}
              <path d={`M${120 - 30 * shoulderW} 115 Q100 125 120 122 Q140 125 ${120 + 30 * shoulderW} 115`}
                fill="none" stroke={skinShadow} strokeWidth="0.5" opacity="0.35" />
              <path d={`M${120 - 25 * shoulderW} 118 Q105 128 120 126`}
                fill="none" stroke={skinShadow} strokeWidth="0.3" opacity="0.2" />
              <path d={`M${120 + 25 * shoulderW} 118 Q135 128 120 126`}
                fill="none" stroke={skinShadow} strokeWidth="0.3" opacity="0.2" />
            </>
          ) : (
            <>
              {/* Pectoral lines */}
              <path d={`M${120 - 35 * shoulderW} 112 Q105 122 120 118 Q135 122 ${120 + 35 * shoulderW} 112`}
                fill="none" stroke={skinShadow} strokeWidth="0.4" opacity={0.2 + muscleDefinition * 0.3} />
              {/* Abs definition */}
              <line x1="120" y1="135" x2="120" y2="200" stroke={skinShadow} strokeWidth="0.3" opacity={muscleDefinition * 0.4} />
              {muscleDefinition > 0.3 && (
                <>
                  <path d="M108 148 L132 148" fill="none" stroke={skinShadow} strokeWidth="0.25" opacity={muscleDefinition * 0.3} />
                  <path d="M110 165 L130 165" fill="none" stroke={skinShadow} strokeWidth="0.25" opacity={muscleDefinition * 0.3} />
                  <path d="M112 182 L128 182" fill="none" stroke={skinShadow} strokeWidth="0.25" opacity={muscleDefinition * 0.3} />
                </>
              )}
            </>
          )}

          {/* Navel */}
          <ellipse cx="120" cy="195" rx="2.5" ry="3" fill={skinShadow} opacity="0.3" />

          {/* ── LEFT ARM ── */}
          <path d={`
            M${120 - 52 * shoulderW} 98
            Q${120 - 62 * shoulderW} 100 ${120 - 66 * shoulderW} 112
            L${120 - 72 * shoulderW} 150
            Q${120 - 75 * shoulderW} 168 ${120 - 74 * shoulderW} 180
            L${120 - 72 * shoulderW} 195
            Q${120 - 70 * shoulderW} 202 ${120 - 66 * shoulderW} 202
            L${120 - 60 * shoulderW} 200
            Q${120 - 56 * shoulderW} 198 ${120 - 56 * shoulderW} 192
            L${120 - 55 * shoulderW} 165
            Q${120 - 54 * shoulderW} 140 ${120 - 52 * shoulderW} 118
            Z
          `} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.6" />
          <path d={`
            M${120 - 52 * shoulderW} 98 Q${120 - 62 * shoulderW} 100 ${120 - 66 * shoulderW} 112
            L${120 - 72 * shoulderW} 150 Q${120 - 75 * shoulderW} 168 ${120 - 74 * shoulderW} 180
            L${120 - 72 * shoulderW} 195 Q${120 - 70 * shoulderW} 202 ${120 - 66 * shoulderW} 202
            L${120 - 60 * shoulderW} 200 Q${120 - 56 * shoulderW} 198 ${120 - 56 * shoulderW} 192
            L${120 - 55 * shoulderW} 165 Q${120 - 54 * shoulderW} 140 ${120 - 52 * shoulderW} 118 Z
          `} fill={`url(#${uid}-musc)`} />
          {/* Deltoid cap */}
          <ellipse cx={120 - 55 * shoulderW} cy="100" rx="8" ry="12"
            fill={skinMid} stroke={skinOutline} strokeWidth="0.4" opacity="0.5" />
          {/* Left hand */}
          <path d={`M${120 - 72 * shoulderW} 198 Q${120 - 76 * shoulderW} 205 ${120 - 74 * shoulderW} 214
                    Q${120 - 72 * shoulderW} 220 ${120 - 66 * shoulderW} 218
                    L${120 - 60 * shoulderW} 210 Q${120 - 58 * shoulderW} 204 ${120 - 60 * shoulderW} 200`}
            fill={skinMid} stroke={skinOutline} strokeWidth="0.4" />

          {/* ── RIGHT ARM ── */}
          <path d={`
            M${120 + 52 * shoulderW} 98
            Q${120 + 62 * shoulderW} 100 ${120 + 66 * shoulderW} 112
            L${120 + 72 * shoulderW} 150
            Q${120 + 75 * shoulderW} 168 ${120 + 74 * shoulderW} 180
            L${120 + 72 * shoulderW} 195
            Q${120 + 70 * shoulderW} 202 ${120 + 66 * shoulderW} 202
            L${120 + 60 * shoulderW} 200
            Q${120 + 56 * shoulderW} 198 ${120 + 56 * shoulderW} 192
            L${120 + 55 * shoulderW} 165
            Q${120 + 54 * shoulderW} 140 ${120 + 52 * shoulderW} 118
            Z
          `} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.6" />
          <path d={`
            M${120 + 52 * shoulderW} 98 Q${120 + 62 * shoulderW} 100 ${120 + 66 * shoulderW} 112
            L${120 + 72 * shoulderW} 150 Q${120 + 75 * shoulderW} 168 ${120 + 74 * shoulderW} 180
            L${120 + 72 * shoulderW} 195 Q${120 + 70 * shoulderW} 202 ${120 + 66 * shoulderW} 202
            L${120 + 60 * shoulderW} 200 Q${120 + 56 * shoulderW} 198 ${120 + 56 * shoulderW} 192
            L${120 + 55 * shoulderW} 165 Q${120 + 54 * shoulderW} 140 ${120 + 52 * shoulderW} 118 Z
          `} fill={`url(#${uid}-musc)`} />
          <ellipse cx={120 + 55 * shoulderW} cy="100" rx="8" ry="12"
            fill={skinMid} stroke={skinOutline} strokeWidth="0.4" opacity="0.5" />
          {/* Right hand */}
          <path d={`M${120 + 72 * shoulderW} 198 Q${120 + 76 * shoulderW} 205 ${120 + 74 * shoulderW} 214
                    Q${120 + 72 * shoulderW} 220 ${120 + 66 * shoulderW} 218
                    L${120 + 60 * shoulderW} 210 Q${120 + 58 * shoulderW} 204 ${120 + 60 * shoulderW} 200`}
            fill={skinMid} stroke={skinOutline} strokeWidth="0.4" />
        </g>

        {/* ── LEGS (separate group, less affected by fat scale) ── */}
        <g>
          {/* Left Thigh */}
          <path d={`
            M${120 - 32 * hipW} 242
            Q${120 - 38 * hipW} 250 ${120 - 40 * hipW} 270
            L${120 - 42 * hipW} 310
            Q${120 - 42 * hipW} 330 ${120 - 38 * hipW} 340
            L${120 - 32 * hipW} 342
            Q${120 - 24 * hipW} 340 ${120 - 22 * hipW} 335
            L${120 - 18 * hipW} 310
            Q${120 - 16 * hipW} 280 ${120 - 18 * hipW} 252
            Z
          `} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.6" />
          <path d={`
            M${120 - 32 * hipW} 242 Q${120 - 38 * hipW} 250 ${120 - 40 * hipW} 270
            L${120 - 42 * hipW} 310 Q${120 - 42 * hipW} 330 ${120 - 38 * hipW} 340
            L${120 - 32 * hipW} 342 Q${120 - 24 * hipW} 340 ${120 - 22 * hipW} 335
            L${120 - 18 * hipW} 310 Q${120 - 16 * hipW} 280 ${120 - 18 * hipW} 252 Z
          `} fill={`url(#${uid}-musc)`} />
          {/* Knee */}
          <ellipse cx={120 - 30 * hipW} cy="342" rx={10 * hipW} ry="5" fill={skinShadow} opacity="0.15" />

          {/* Left Calf */}
          <path d={`
            M${120 - 38 * hipW} 342
            Q${120 - 40 * hipW} 350 ${120 - 38 * hipW} 370
            L${120 - 36 * hipW} 400
            Q${120 - 35 * hipW} 415 ${120 - 32 * hipW} 420
            L${120 - 26 * hipW} 422
            Q${120 - 22 * hipW} 420 ${120 - 22 * hipW} 415
            L${120 - 20 * hipW} 400
            Q${120 - 18 * hipW} 375 ${120 - 22 * hipW} 342
            Z
          `} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.5" />

          {/* Left Foot */}
          <path d={`
            M${120 - 36 * hipW} 420
            L${120 - 40 * hipW} 430
            Q${120 - 42 * hipW} 438 ${120 - 36 * hipW} 440
            L${120 - 20 * hipW} 440
            Q${120 - 16 * hipW} 438 ${120 - 18 * hipW} 430
            L${120 - 22 * hipW} 420
            Z
          `} fill={skinMid} stroke={skinOutline} strokeWidth="0.4" />

          {/* Right Thigh */}
          <path d={`
            M${120 + 32 * hipW} 242
            Q${120 + 38 * hipW} 250 ${120 + 40 * hipW} 270
            L${120 + 42 * hipW} 310
            Q${120 + 42 * hipW} 330 ${120 + 38 * hipW} 340
            L${120 + 32 * hipW} 342
            Q${120 + 24 * hipW} 340 ${120 + 22 * hipW} 335
            L${120 + 18 * hipW} 310
            Q${120 + 16 * hipW} 280 ${120 + 18 * hipW} 252
            Z
          `} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.6" />
          <path d={`
            M${120 + 32 * hipW} 242 Q${120 + 38 * hipW} 250 ${120 + 40 * hipW} 270
            L${120 + 42 * hipW} 310 Q${120 + 42 * hipW} 330 ${120 + 38 * hipW} 340
            L${120 + 32 * hipW} 342 Q${120 + 24 * hipW} 340 ${120 + 22 * hipW} 335
            L${120 + 18 * hipW} 310 Q${120 + 16 * hipW} 280 ${120 + 18 * hipW} 252 Z
          `} fill={`url(#${uid}-musc)`} />
          <ellipse cx={120 + 30 * hipW} cy="342" rx={10 * hipW} ry="5" fill={skinShadow} opacity="0.15" />

          {/* Right Calf */}
          <path d={`
            M${120 + 38 * hipW} 342
            Q${120 + 40 * hipW} 350 ${120 + 38 * hipW} 370
            L${120 + 36 * hipW} 400
            Q${120 + 35 * hipW} 415 ${120 + 32 * hipW} 420
            L${120 + 26 * hipW} 422
            Q${120 + 22 * hipW} 420 ${120 + 22 * hipW} 415
            L${120 + 20 * hipW} 400
            Q${120 + 18 * hipW} 375 ${120 + 22 * hipW} 342
            Z
          `} fill={`url(#${uid}-skin)`} stroke={skinOutline} strokeWidth="0.5" />

          {/* Right Foot */}
          <path d={`
            M${120 + 36 * hipW} 420
            L${120 + 40 * hipW} 430
            Q${120 + 42 * hipW} 438 ${120 + 36 * hipW} 440
            L${120 + 20 * hipW} 440
            Q${120 + 16 * hipW} 438 ${120 + 18 * hipW} 430
            L${120 + 22 * hipW} 420
            Z
          `} fill={skinMid} stroke={skinOutline} strokeWidth="0.4" />
        </g>

        {/* ── METRIC LABELS (only on md size) ── */}
        {size === "md" && (
          <>
            {record.body_fat_pct != null && (
              <g>
                <rect x="1" y="168" width="42" height="18" rx="5" fill={fatColor} opacity="0.9" />
                <text x="22" y="180" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui">
                  {record.body_fat_pct}%
                </text>
                <line x1="43" y1="177" x2="62" y2="177" stroke={fatColor} strokeWidth="1" strokeDasharray="2 2" />
                <text x="22" y="197" textAnchor="middle" fontSize="7" fill={skinOutline} opacity="0.7">gordura</text>
              </g>
            )}
            {record.muscle_mass != null && (
              <g>
                <rect x="196" y="128" width="42" height="18" rx="5" fill={muscleColor} opacity="0.9" />
                <text x="217" y="140" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui">
                  {record.muscle_mass}kg
                </text>
                <line x1="196" y1="137" x2="178" y2="140" stroke={muscleColor} strokeWidth="1" strokeDasharray="2 2" />
                <text x="217" y="157" textAnchor="middle" fontSize="7" fill={skinOutline} opacity="0.7">músculo</text>
              </g>
            )}
            {record.weight != null && (
              <g>
                <rect x="196" y="82" width="42" height="18" rx="5" fill="hsl(220, 55%, 48%)" opacity="0.9" />
                <text x="217" y="94" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui">
                  {record.weight}kg
                </text>
                <text x="217" y="111" textAnchor="middle" fontSize="7" fill={skinOutline} opacity="0.7">peso</text>
              </g>
            )}
            {record.lean_mass != null && (
              <g>
                <rect x="1" y="288" width="42" height="18" rx="5" fill="hsl(200, 45%, 48%)" opacity="0.9" />
                <text x="22" y="300" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="system-ui">
                  {record.lean_mass}kg
                </text>
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

/* ── Diff Badge ── */
const DiffBadge = ({ diff, inverse = false }: { diff: number | null; inverse?: boolean }) => {
  if (diff == null || diff === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
  const isGood = inverse ? diff > 0 : diff < 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${isGood ? "text-accent" : "text-destructive"}`}>
      {diff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(diff).toFixed(1)}
    </span>
  );
};

const BioimpedanceDialog = ({ open, onOpenChange, studentId, studentName, gender = "masculino" }: Props) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<BioRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("main");
  const [uploading, setUploading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BioRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = { measured_at: new Date().toISOString().split("T")[0], notes: "" };
    NUMERIC_KEYS.forEach(k => init[k] = "");
    return init;
  });
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    if (open && studentId) { fetchRecords(); setView("main"); }
  }, [open, studentId]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("student_bioimpedance")
      .select("*")
      .eq("student_id", studentId)
      .order("measured_at", { ascending: false });
    setRecords((data as any[]) || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `bioimpedance/${studentId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("exercise-videos").upload(path, file);
    if (error) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("exercise-videos").getPublicUrl(path);
    setFileUrl(urlData.publicUrl);
    setUploading(false);
    toast.success("Arquivo enviado!");
  };

  const handleSave = async () => {
    const payload: any = {
      student_id: studentId,
      professor_id: user!.id,
      measured_at: form.measured_at,
      file_url: fileUrl || null,
      notes: form.notes || null,
    };
    NUMERIC_KEYS.forEach(k => {
      payload[k] = form[k] ? parseFloat(form[k]) : null;
    });
    if (form.age) payload.age = parseInt(form.age);
    if (form.cellular_age) payload.cellular_age = parseInt(form.cellular_age);

    const { error } = await supabase.from("student_bioimpedance").insert(payload);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Bioimpedância registrada!");
    setView("main");
    const init: Record<string, string> = { measured_at: new Date().toISOString().split("T")[0], notes: "" };
    NUMERIC_KEYS.forEach(k => init[k] = "");
    setForm(init);
    setFileUrl("");
    fetchRecords();
  };

  const getDiff = (current: number | null, previous: number | null) => {
    if (current == null || previous == null) return null;
    return current - previous;
  };

  const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  const formatDateShort = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return `${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear().toString().slice(2)}`;
  };

  // Chart data (chronological)
  const chartData = [...records].reverse().map(r => ({
    date: formatDateShort(r.measured_at),
    fullDate: formatDate(r.measured_at),
    peso: r.weight,
    imc: r.bmi,
    gordura: r.body_fat_pct,
    massaMagra: r.lean_mass,
    massaMuscular: r.muscle_mass,
    massaGorda: r.fat_mass,
    agua: r.total_body_water,
  }));

  // Radar chart data for latest vs oldest
  const radarData = (() => {
    if (records.length < 2) return [];
    const latest = records[0];
    const oldest = records[records.length - 1];
    const metrics = [
      { subject: "Peso", A: oldest.weight, B: latest.weight },
      { subject: "Massa Magra", A: oldest.lean_mass, B: latest.lean_mass },
      { subject: "Massa Muscular", A: oldest.muscle_mass, B: latest.muscle_mass },
      { subject: "Massa Gorda", A: oldest.fat_mass, B: latest.fat_mass },
      { subject: "Água", A: oldest.total_body_water, B: latest.total_body_water },
      { subject: "Metabolismo", A: oldest.basal_metabolism ? oldest.basal_metabolism / 10 : null, B: latest.basal_metabolism ? latest.basal_metabolism / 10 : null },
    ];
    return metrics.filter(m => m.A != null && m.B != null);
  })();

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

  // ── MAIN VIEW ──
  const renderMain = () => (
    <div className="space-y-3 mt-2">
      <button onClick={() => setView("form")} className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-display font-bold text-primary">Nova Avaliação</span>
      </button>

      {records.length >= 2 && (
        <button onClick={() => setView("compare")} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-gradient-to-r from-card to-secondary/30 hover:border-primary/30 transition-all">
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left flex-1">
            <span className="text-sm font-display font-bold text-foreground">Ver Comparativo</span>
            <p className="text-[10px] text-muted-foreground">Gráficos de evolução e avatar corporal</p>
          </div>
          <ArrowUp className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pt-2">Histórico ({records.length})</p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : records.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">Nenhuma avaliação registrada</p>
      ) : (
        <div className="space-y-2">
          {records.map((r, idx) => {
            const prev = records[idx + 1];
            return (
              <button key={r.id} onClick={() => { setSelectedRecord(r); setView("detail"); }}
                className="w-full rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all text-left group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="font-display font-bold text-sm text-foreground">{formatDate(r.measured_at)}</p>
                  </div>
                  {idx === 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/15 text-primary">ATUAL</span>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Scale, label: "Peso", value: r.weight, unit: "kg", prev: prev?.weight },
                    { icon: Activity, label: "IMC", value: r.bmi, unit: "", prev: prev?.bmi },
                    { icon: Percent, label: "Gordura", value: r.body_fat_pct, unit: "%", prev: prev?.body_fat_pct },
                  ].map(({ icon: Icon, label, value, unit, prev: prevVal }) => {
                    const diff = getDiff(value, prevVal);
                    return (
                      <div key={label} className="bg-secondary/60 rounded-lg p-2 group-hover:bg-secondary/80 transition-colors">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground">
                            {value != null ? `${value}${unit ? ` ${unit}` : ""}` : "—"}
                          </p>
                          {diff != null && diff !== 0 && <DiffBadge diff={diff} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── DETAIL VIEW ──
  const renderDetail = () => {
    if (!selectedRecord) return null;
    const idx = records.findIndex(r => r.id === selectedRecord.id);
    const prev = idx >= 0 ? records[idx + 1] : undefined;

    return (
      <div className="space-y-4 mt-2">
        <button onClick={() => setView("main")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center justify-between">
          <p className="font-display font-bold text-foreground text-lg">{formatDate(selectedRecord.measured_at)}</p>
        </div>

        <div className="flex justify-center py-2">
          <HumanBody record={selectedRecord} size="md" gender={gender} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FIELD_LABELS.map(({ key, label, unit }) => {
            const val = selectedRecord[key] as number | null;
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

        {selectedRecord.notes && (
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Observações</p>
            <p className="text-sm text-foreground">{selectedRecord.notes}</p>
          </div>
        )}
        {selectedRecord.file_url && (
          <a href={selectedRecord.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block">Ver exame anexado</a>
        )}
      </div>
    );
  };

  // ── COMPARE VIEW ──
  const renderCompare = () => {
    const latest = records[0];
    const oldest = records[records.length - 1];

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

    return (
      <div className="space-y-5 mt-2">
        <button onClick={() => setView("main")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="text-center">
          <p className="font-display font-bold text-foreground text-lg">Evolução Corporal</p>
          <p className="text-xs text-muted-foreground">{records.length} avaliações registradas</p>
        </div>

        {/* Avatar comparison */}
        {latest && oldest && records.length >= 2 && (
          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/30 to-card p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">{formatDate(oldest.measured_at)}</p>
                <p className="text-[9px] text-muted-foreground mb-2">Início</p>
                <HumanBody record={oldest} size="sm" gender={gender} />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-primary font-bold uppercase mb-1">{formatDate(latest.measured_at)}</p>
                <p className="text-[9px] text-primary mb-2">Atual</p>
                <HumanBody record={latest} size="sm" gender={gender} />
              </div>
            </div>
          </div>
        )}

        {/* Detailed comparison table */}
        {latest && oldest && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 bg-secondary/70 px-3 py-2">
              <p className="text-[10px] font-bold text-muted-foreground">Métrica</p>
              <p className="text-[10px] font-bold text-muted-foreground text-center">Início</p>
              <p className="text-[10px] font-bold text-muted-foreground text-center">Atual</p>
              <p className="text-[10px] font-bold text-muted-foreground text-right">Diff</p>
            </div>
            {compareMetrics.map(({ label, key, unit, icon }) => {
              const oldVal = oldest[key] as number | null;
              const newVal = latest[key] as number | null;
              if (oldVal == null && newVal == null) return null;
              const diff = getDiff(newVal, oldVal);
              return (
                <div key={key} className="grid grid-cols-4 items-center px-3 py-2 border-t border-border/50 hover:bg-secondary/30 transition-colors">
                  <p className="text-xs text-foreground">{icon} {label}</p>
                  <p className="text-xs font-medium text-muted-foreground text-center">{oldVal ?? "—"}{oldVal != null && unit ? ` ${unit}` : ""}</p>
                  <p className="text-xs font-bold text-foreground text-center">{newVal ?? "—"}{newVal != null && unit ? ` ${unit}` : ""}</p>
                  <div className="flex justify-end">{diff != null ? <DiffBadge diff={diff} /> : <span className="text-xs text-muted-foreground">—</span>}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
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
          </div>
        )}

        {/* Line Charts */}
        {chartData.length >= 2 && (
          <>
            {/* Weight + Body Composition */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-3">Peso & Composição (kg)</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220, 60%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(220, 60%, 50%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gordGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 60%, 55%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(0, 60%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="peso" stroke="hsl(220, 60%, 50%)" fill="url(#pesoGrad)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} name="Peso" />
                    <Area type="monotone" dataKey="massaGorda" stroke="hsl(0, 60%, 55%)" fill="url(#gordGrad)" strokeWidth={2} dot={{ r: 3 }} name="M. Gorda" />
                    <Line type="monotone" dataKey="massaMagra" stroke="hsl(150, 55%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="M. Magra" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fat % & IMC */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-3">% Gordura & IMC</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="gordura" stroke="hsl(0, 65%, 55%)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} name="% Gordura" />
                    <Line type="monotone" dataKey="imc" stroke="hsl(35, 85%, 50%)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} name="IMC" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar chart: muscle vs fat mass */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-3">Músculo vs Gordura (kg)</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="massaMuscular" fill="hsl(150, 55%, 45%)" radius={[4, 4, 0, 0]} name="Muscular" />
                    <Bar dataKey="massaGorda" fill="hsl(0, 60%, 55%)" radius={[4, 4, 0, 0]} name="Gorda" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── FORM VIEW ──
  const renderForm = () => (
    <div className="space-y-4 mt-2">
      <button onClick={() => setView("main")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <div>
        <label className="text-sm font-medium text-foreground">Data da Medição</label>
        <input type="date" value={form.measured_at} onChange={(e) => setForm({ ...form, measured_at: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FIELD_LABELS.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="text-xs font-medium text-foreground">{label} {unit && `(${unit})`}</label>
            <input type="number" step={key === "age" || key === "cellular_age" ? "1" : "0.01"} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Upload do Exame (foto/PDF)</label>
        <div className="mt-1">
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground cursor-pointer hover:bg-secondary/80">
            <Upload className="w-4 h-4" />
            {uploading ? "Enviando..." : fileUrl ? "Arquivo enviado ✓" : "Selecionar arquivo"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Observações</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
      </div>
      <button onClick={handleSave} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors">Salvar Bioimpedância</button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Bioimpedância — {studentName}
          </DialogTitle>
        </DialogHeader>
        {view === "main" && renderMain()}
        {view === "form" && renderForm()}
        {view === "detail" && renderDetail()}
        {view === "compare" && renderCompare()}
      </DialogContent>
    </Dialog>
  );
};

export default BioimpedanceDialog;
