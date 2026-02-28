import { useState, useMemo, useCallback } from "react";
import { exercises, PILARES, type Exercise } from "@/data/exercises";
import { Search, Plus, Dumbbell, Star, User, X } from "lucide-react";
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

type SpecialFilter = "favorites" | "custom" | null;

function loadFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem("ps-favorites");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem("ps-favorites", JSON.stringify([...favs]));
}

function loadCustomExercises(): Exercise[] {
  try {
    const stored = localStorage.getItem("ps-custom-exercises");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomExercises(list: Exercise[]) {
  localStorage.setItem("ps-custom-exercises", JSON.stringify(list));
}

const ExerciseLibrary = ({ onAddExercise }: ExerciseLibraryProps) => {
  const [search, setSearch] = useState("");
  const [activePilar, setActivePilar] = useState<string | null>(null);
  const [specialFilter, setSpecialFilter] = useState<SpecialFilter>(null);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [customExercises, setCustomExercises] = useState<Exercise[]>(loadCustomExercises);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleFavorite = useCallback((e: React.MouseEvent, exerciseId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      saveFavorites(next);
      return next;
    });
  }, []);

  const allExercises = useMemo(() => [...exercises, ...customExercises], [customExercises]);

  const filtered = useMemo(() => {
    return allExercises.filter((ex) => {
      if (specialFilter === "favorites" && !favorites.has(ex.id)) return false;
      if (specialFilter === "custom" && !customExercises.some((c) => c.id === ex.id)) return false;
      if (!specialFilter && activePilar && ex.pilar !== activePilar) return false;
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activePilar, specialFilter, favorites, allExercises, customExercises]);

  const handleAddCustom = () => {
    const name = newExerciseName.trim();
    if (!name) return;
    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name,
      pilar: "PERSONALIZADO",
      classe: "PERSONALIZADO",
    };
    const updated = [...customExercises, newEx];
    setCustomExercises(updated);
    saveCustomExercises(updated);
    setNewExerciseName("");
    setShowAddForm(false);
  };

  const removeCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = customExercises.filter((c) => c.id !== id);
    setCustomExercises(updated);
    saveCustomExercises(updated);
  };

  const selectPilar = (p: string | null) => {
    setActivePilar(p);
    setSpecialFilter(null);
  };

  const selectSpecial = (f: SpecialFilter) => {
    setSpecialFilter(f === specialFilter ? null : f);
    setActivePilar(null);
  };

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

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { selectPilar(null); setSpecialFilter(null); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              !activePilar && !specialFilter
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => selectSpecial("favorites")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              specialFilter === "favorites"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className="w-3 h-3" />
            Favoritos
          </button>
          <button
            onClick={() => selectSpecial("custom")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              specialFilter === "custom"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-3 h-3" />
            Meus Exercícios
          </button>
          {PILARES.map((p) => (
            <button
              key={p}
              onClick={() => selectPilar(p === activePilar ? null : p)}
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
      </div>

      {/* Add custom exercise form (shown when "Meus Exercícios" is active) */}
      {specialFilter === "custom" && (
        <div className="px-4 py-3 border-b border-border">
          {showAddForm ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do exercício..."
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
                autoFocus
              />
              <button
                onClick={handleAddCustom}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Adicionar
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewExerciseName(""); }}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar exercício
            </button>
          )}
        </div>
      )}

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((ex) => {
            const isCustom = customExercises.some((c) => c.id === ex.id);
            const isFav = favorites.has(ex.id);
            return (
              <motion.div
                key={ex.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="group flex items-center gap-2 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                onClick={() => onAddExercise(ex)}
              >
                <button
                  onClick={(e) => toggleFavorite(e, ex.id)}
                  className="shrink-0 p-0.5 transition-colors"
                  title={isFav ? "Remover favorito" : "Favoritar"}
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      isFav
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/40 group-hover:text-muted-foreground"
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {isCustom ? "Meu exercício" : ex.classe}
                  </p>
                </div>
                {isCustom && (
                  <button
                    onClick={(e) => removeCustom(e, ex.id)}
                    className="p-1 hover:bg-destructive/20 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover exercício"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExerciseLibrary;
