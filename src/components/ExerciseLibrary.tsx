import { useState, useMemo } from "react";
import { exercises, muscleCategories, subCategories, type MuscleCategory, type SubCategory, type Exercise } from "@/data/exercises";
import { Search, Filter, Plus, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExerciseLibraryProps {
  onAddExercise: (exercise: Exercise) => void;
}

const ExerciseLibrary = ({ onAddExercise }: ExerciseLibraryProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MuscleCategory | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubCategory | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || ex.category === selectedCategory;
      const matchSub = !selectedSub || ex.subCategory === selectedSub;
      return matchSearch && matchCat && matchSub;
    });
  }, [search, selectedCategory, selectedSub]);

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

        {/* Muscle category pills */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Grupo Muscular</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {muscleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sub category pills */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-muted-foreground font-medium">Pilar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {subCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSub(selectedSub === sub ? null : sub)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedSub === sub
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-border"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-primary font-medium">{ex.category}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{ex.subCategory}</span>
                  {ex.equipment && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{ex.equipment}</span>
                    </>
                  )}
                </div>
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
