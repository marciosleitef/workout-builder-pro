import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { exercises, PILARES, type Exercise } from "@/data/exercises";
import { Search, Plus, Dumbbell, Star, User, X, Upload, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  try { const stored = localStorage.getItem("ps-favorites"); return stored ? new Set(JSON.parse(stored)) : new Set(); } catch { return new Set(); }
}
function saveFavorites(favs: Set<string>) { localStorage.setItem("ps-favorites", JSON.stringify([...favs])); }
function loadCustomExercises(): Exercise[] {
  try { const stored = localStorage.getItem("ps-custom-exercises"); return stored ? JSON.parse(stored) : []; } catch { return []; }
}
function saveCustomExercises(list: Exercise[]) { localStorage.setItem("ps-custom-exercises", JSON.stringify(list)); }

const ExerciseLibraryPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activePilar, setActivePilar] = useState<string | null>(null);
  const [specialFilter, setSpecialFilter] = useState<SpecialFilter>(null);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [customExercises, setCustomExercises] = useState<Exercise[]>(loadCustomExercises);
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExPilar, setNewExPilar] = useState(PILARES[0]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allExercises = useMemo(() => [...exercises, ...customExercises], [customExercises]);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = allExercises;
    if (specialFilter === "favorites") list = list.filter((e) => favorites.has(e.id));
    else if (specialFilter === "custom") list = customExercises;
    else if (activePilar) list = list.filter((e) => e.pilar === activePilar);
    if (search) list = list.filter((e) => e.nome.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [search, activePilar, specialFilter, favorites, allExercises, customExercises]);

  const handleCreateExercise = async () => {
    if (!newExName.trim()) return;
    let videoUrl = "";
    if (videoFile) {
      setUploading(true);
      const ext = videoFile.name.split(".").pop();
      const path = `custom/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("exercise-videos").upload(path, videoFile);
      if (!error) {
        const { data } = supabase.storage.from("exercise-videos").getPublicUrl(path);
        videoUrl = data.publicUrl;
      }
      setUploading(false);
    }
    const newEx: Exercise = { id: `custom-${Date.now()}`, nome: newExName.trim(), pilar: newExPilar, videoUrl: videoUrl || undefined, isCustom: true };
    const updated = [...customExercises, newEx];
    setCustomExercises(updated);
    saveCustomExercises(updated);
    setNewExName("");
    setVideoFile(null);
    setShowNewExercise(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display font-bold text-lg text-foreground">Biblioteca de Exercícios</h1>
          <div className="flex-1" />
          <button onClick={() => setShowNewExercise(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Novo
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar exercício..." className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          <button onClick={() => { setSpecialFilter(specialFilter === "favorites" ? null : "favorites"); setActivePilar(null); }} className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${specialFilter === "favorites" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/30"}`}>
            <Star className="w-3 h-3" /> Favoritos
          </button>
          <button onClick={() => { setSpecialFilter(specialFilter === "custom" ? null : "custom"); setActivePilar(null); }} className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${specialFilter === "custom" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/30"}`}>
            <User className="w-3 h-3" /> Meus
          </button>
          {PILARES.map((p) => (
            <button key={p} onClick={() => { setActivePilar(activePilar === p ? null : p); setSpecialFilter(null); }} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activePilar === p ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/30"}`}>
              {PILAR_SHORT[p] || p}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum exercício encontrado</p>
            </div>
          ) : (
            filtered.map((ex) => (
              <div key={ex.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedExercise(ex)}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-foreground truncate">{ex.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{PILAR_SHORT[ex.pilar] || ex.pilar}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(ex.id); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${favorites.has(ex.id) ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}>
                  <Star className={`w-4 h-4 ${favorites.has(ex.id) ? "fill-current" : ""}`} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Exercise detail dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={(o) => !o && setSelectedExercise(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{selectedExercise?.nome}</DialogTitle></DialogHeader>
          {selectedExercise && (
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Pilar:</span> {selectedExercise.pilar}</p>
              {selectedExercise.videoUrl && (
                <video src={selectedExercise.videoUrl} controls className="w-full rounded-lg" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New exercise dialog */}
      <Dialog open={showNewExercise} onOpenChange={setShowNewExercise}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Novo Exercício</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-foreground">Nome *</label><input value={newExName} onChange={(e) => setNewExName(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Pilar</label>
              <select value={newExPilar} onChange={(e) => setNewExPilar(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {PILARES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Vídeo (opcional)</label>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="w-full mt-1 text-sm text-muted-foreground" />
            </div>
            <button onClick={handleCreateExercise} disabled={uploading || !newExName.trim()} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Enviando..." : "Criar Exercício"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseLibraryPage;
