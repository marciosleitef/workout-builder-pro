import { Exercise } from "@/data/exercises";

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets?: string;
  reps?: string;
  load?: string;
  rest?: string;
  speed?: string;
  distance?: string;
  duration?: string;
  breathing?: string;
  calories?: string;
  notes?: string;
}

export interface ExerciseGroup {
  id: string;
  name: string;
  color: string;
  items: (WorkoutExercise | BiSet)[];
}

export interface BiSet {
  id: string;
  type: "biset";
  exercises: WorkoutExercise[];
}

export function isBiSet(item: WorkoutExercise | BiSet): item is BiSet {
  return "type" in item && item.type === "biset";
}
