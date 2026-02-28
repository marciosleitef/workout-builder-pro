import { WorkoutExercise } from "@/types/workout";
import { Hash, RotateCw, Dumbbell, Timer, Gauge, Ruler, Clock, Wind, Flame } from "lucide-react";

interface ExerciseParamFieldsProps {
  item: WorkoutExercise;
  groupId: string;
  onUpdate: (groupId: string, itemId: string, field: string, value: string) => void;
}

const FIELDS = [
  { key: "sets", label: "Séries", placeholder: "0", icon: Hash },
  { key: "reps", label: "Repetições", placeholder: "0", icon: RotateCw },
  { key: "load", label: "Carga (kg)", placeholder: "0", icon: Dumbbell },
  { key: "rest", label: "Intervalo (seg)", placeholder: "0", icon: Timer },
  { key: "speed", label: "Velocidade", placeholder: "0", icon: Gauge },
  { key: "distance", label: "Distância (m)", placeholder: "0", icon: Ruler },
  { key: "duration", label: "Tempo (min)", placeholder: "0", icon: Clock },
  { key: "breathing", label: "Respiração", placeholder: "0", icon: Wind },
  { key: "calories", label: "Meta de calorias", placeholder: "0", icon: Flame },
] as const;

const ExerciseParamFields = ({ item, groupId, onUpdate }: ExerciseParamFieldsProps) => {
  return (
    <div className="px-3 pb-3 pt-1 space-y-2">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key}>
              <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                <Icon className="w-3 h-3" />
                {f.label}
              </label>
              <input
                value={(item as any)[f.key] || ""}
                onChange={(e) => onUpdate(groupId, item.id, f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-2 py-1.5 text-xs bg-secondary/60 border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          );
        })}
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Observações
        </label>
        <textarea
          value={item.notes || ""}
          onChange={(e) => onUpdate(groupId, item.id, "notes", e.target.value)}
          placeholder="Orientações de execução, equipamentos, instruções..."
          rows={2}
          className="w-full mt-0.5 px-2 py-1.5 text-xs bg-secondary/60 border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      </div>
    </div>
  );
};

export default ExerciseParamFields;
