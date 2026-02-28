import { WorkoutExercise } from "@/types/workout";

interface ExerciseParamFieldsProps {
  item: WorkoutExercise;
  groupId: string;
  onUpdate: (groupId: string, itemId: string, field: string, value: string) => void;
}

const FIELDS = [
  { key: "sets", label: "Séries", placeholder: "3" },
  { key: "reps", label: "Reps", placeholder: "12" },
  { key: "load", label: "Carga", placeholder: "20kg" },
  { key: "rest", label: "Descanso", placeholder: "60s" },
  { key: "method", label: "Método", placeholder: "Drop-set" },
] as const;

const ExerciseParamFields = ({ item, groupId, onUpdate }: ExerciseParamFieldsProps) => {
  return (
    <div className="px-3 pb-3 pt-1 space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {f.label}
            </label>
            <input
              value={(item as any)[f.key] || ""}
              onChange={(e) => onUpdate(groupId, item.id, f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full mt-0.5 px-2 py-1.5 text-xs bg-secondary/60 border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Observação
        </label>
        <input
          value={item.notes || ""}
          onChange={(e) => onUpdate(groupId, item.id, "notes", e.target.value)}
          placeholder="Ex: Unilateral, tempo 3-1-2..."
          className="w-full mt-0.5 px-2 py-1.5 text-xs bg-secondary/60 border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>
    </div>
  );
};

export default ExerciseParamFields;
