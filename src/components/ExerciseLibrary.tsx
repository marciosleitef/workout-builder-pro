import { useState, useMemo } from "react";
import { exercises, PILARES, type Exercise } from "@/data/exercises";
import { Search, Plus, Dumbbell, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExerciseLibraryProps {
  onAddExercise: (exercise: Exercise) => void;
}

const PILAR_SHORT: Record<string, string> = {
  "LIBERAÇÃO MIOFACIAL": "Lib. Miofascial",
  "MOBILIDADE E ESTABILIDADE": "Mob. & Estab.",
  "ALONGAMENTOS DINÂMICOS": "Along. Dinâm.",
  "POTÊNCIA": "Potência",
  "CORE": "Core",
  "FORÇA - MEMBROS SUPERIORES": "Força MS",
  "FORÇA - MEMBROS INFERIORES": "Força MI",
  "CONDICIONAMENTO": "Condicion.",
};

const ExerciseLibrary = ({ onAddExercise }: ExerciseLibraryProps) => {
  const [search, setSearch] = useState("");
  const [activePilar, setActivePilar] = useState<string | null>(null);
  const [activeClasse, setActiveClasse] = useState<string | null>(null);

  const classes = useMemo(() => {
    if (!activePilar) return [];
    const set = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.pilar === activePilar) set.add(ex.classe);
    });
    return Array.from(set);
  }, [activePilar]);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (activePilar && ex.pilar !== activePilar) return false;
      if (activeClasse && ex.classe !== activeClasse) return false;
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activePilar, activeClasse]);

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

        {/* Pilar filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setActivePilar(null); setActiveClasse(null); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              !activePilar
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {PILARES.map((p) => (
            <button
              key={p}
              onClick={() => { setActivePilar(p === activePilar ? null : p); setActiveClasse(null); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activePilar === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {PILAR_SHORT[p] || p}
            </button>
          ))}
        </div>

        {/* Classe filter */}
        {activePilar && classes.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveClasse(null)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                !activeClasse
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas classes
            </button>
            {classes.map((c) => (
              <button
                key={c}
                onClick={() => setActiveClasse(c === activeClasse ? null : c)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeClasse === c
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
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
                <p className="text-[11px] text-muted-foreground truncate">{ex.classe}</p>
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
