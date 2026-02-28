import { useState, useMemo } from "react";
import { exercises, type Exercise } from "@/data/exercises";
import { Search, Plus, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExerciseLibraryProps {
  onAddExercise: (exercise: Exercise) => void;
}

const ExerciseLibrary = ({ onAddExercise }: ExerciseLibraryProps) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return exercises.filter((ex) =>
      ex.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Exercícios</h2>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} itens</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg pl-9 pr-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((ex) => (
            <motion.div
              key={ex.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
              onClick={() => onAddExercise(ex)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
              </div>
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExerciseLibrary;
