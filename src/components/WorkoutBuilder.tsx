import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { ExerciseGroup, WorkoutExercise, BiSet, isBiSet } from "@/types/workout";
import { GripVertical, X, Link2, Unlink, Trash2, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WorkoutBuilderProps {
  groups: ExerciseGroup[];
  setGroups: React.Dispatch<React.SetStateAction<ExerciseGroup[]>>;
}

const GROUP_COLORS = [
  "hsl(82 85% 55% / 0.15)",
  "hsl(200 80% 55% / 0.15)",
  "hsl(340 75% 55% / 0.15)",
  "hsl(45 90% 55% / 0.15)",
  "hsl(270 70% 55% / 0.15)",
];

const GROUP_BORDER_COLORS = [
  "hsl(82 85% 55% / 0.4)",
  "hsl(200 80% 55% / 0.4)",
  "hsl(340 75% 55% / 0.4)",
  "hsl(45 90% 55% / 0.4)",
  "hsl(270 70% 55% / 0.4)",
];

const WorkoutBuilder = ({ groups, setGroups }: WorkoutBuilderProps) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const addGroup = () => {
    const idx = groups.length % GROUP_COLORS.length;
    const defaultNames = ["Aquecimento", "Parte 1", "Parte 2", "Parte 3", "Finalização"];
    setGroups((prev) => [
      ...prev,
      {
        id: `group-${Date.now()}`,
        name: defaultNames[prev.length] || `Parte ${prev.length}`,
        color: GROUP_COLORS[idx],
        items: [],
      },
    ]);
  };

  const removeGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const renameGroup = (groupId: string, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name } : g)));
  };

  const removeItem = (groupId: string, itemId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g
      )
    );
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const toggleSelect = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const createBiSet = (groupId: string) => {
    if (selectedItems.size < 2) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const selected: WorkoutExercise[] = [];
        const remaining: (WorkoutExercise | BiSet)[] = [];
        g.items.forEach((item) => {
          if (!isBiSet(item) && selectedItems.has(item.id)) {
            selected.push(item);
          } else {
            remaining.push(item);
          }
        });
        if (selected.length < 2) return g;
        const biset: BiSet = {
          id: `biset-${Date.now()}`,
          type: "biset",
          exercises: selected,
        };
        // Insert biset where the first selected item was
        const firstIndex = g.items.findIndex((i) => !isBiSet(i) && selectedItems.has(i.id));
        remaining.splice(firstIndex, 0, biset);
        return { ...g, items: remaining };
      })
    );
    setSelectedItems(new Set());
  };

  const breakBiSet = (groupId: string, bisetId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const newItems: (WorkoutExercise | BiSet)[] = [];
        g.items.forEach((item) => {
          if (isBiSet(item) && item.id === bisetId) {
            newItems.push(...item.exercises);
          } else {
            newItems.push(item);
          }
        });
        return { ...g, items: newItems };
      })
    );
  };

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;
      if (!destination) return;

      setGroups((prev) => {
        const newGroups = prev.map((g) => ({ ...g, items: [...g.items] }));
        const srcGroup = newGroups.find((g) => g.id === source.droppableId);
        const destGroup = newGroups.find((g) => g.id === destination.droppableId);
        if (!srcGroup || !destGroup) return prev;

        const [moved] = srcGroup.items.splice(source.index, 1);
        destGroup.items.splice(destination.index, 0, moved);
        return newGroups;
      });
    },
    [setGroups]
  );

  const hasSelection = selectedItems.size >= 2;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Montagem do Treino</h2>
        <button
          onClick={addGroup}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Grupo
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <PlusCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Crie um grupo para começar</p>
              <button
                onClick={addGroup}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Criar Primeiro Grupo
              </button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {groups.map((group, gi) => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: GROUP_COLORS[gi % GROUP_COLORS.length],
                  borderColor: GROUP_BORDER_COLORS[gi % GROUP_BORDER_COLORS.length],
                }}
              >
                {/* Group header */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <input
                    value={group.name}
                    onChange={(e) => renameGroup(group.id, e.target.value)}
                    className="bg-transparent font-display font-bold text-foreground text-sm border-none outline-none flex-1"
                  />
                  <div className="flex items-center gap-1">
                    {hasSelection && (
                      <button
                        onClick={() => createBiSet(group.id)}
                        className="p-1.5 rounded-md hover:bg-background/30 text-primary transition-colors"
                        title="Criar Bi-Set"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={group.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[48px] px-2 pb-2 transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5" : ""
                      }`}
                    >
                      {group.items.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Clique em exercícios para adicionar aqui
                        </p>
                      )}
                      {group.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`mb-1 rounded-lg transition-shadow ${
                                dragSnapshot.isDragging ? "shadow-lg shadow-primary/10" : ""
                              }`}
                            >
                              {isBiSet(item) ? (
                                <div className="border border-primary/30 rounded-lg bg-background/60 overflow-hidden">
                                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-primary/20">
                                    <div {...dragProvided.dragHandleProps}>
                                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <Link2 className="w-3 h-3 text-primary" />
                                    <span className="text-xs font-display font-semibold text-primary">
                                      Bi-Set
                                    </span>
                                    <button
                                      onClick={() => breakBiSet(group.id, item.id)}
                                      className="ml-auto p-1 hover:bg-secondary rounded"
                                      title="Desfazer Bi-Set"
                                    >
                                      <Unlink className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                  </div>
                                  {item.exercises.map((ex) => (
                                    <div
                                      key={ex.id}
                                      className="flex items-center gap-2 px-3 py-2 border-b border-border/50 last:border-0"
                                    >
                                      <span className="text-sm text-foreground flex-1">{ex.exercise.name}</span>
                                      <button
                                        onClick={() => {
                                          // Remove from biset
                                          setGroups((prev) =>
                                            prev.map((g) => {
                                              if (g.id !== group.id) return g;
                                              return {
                                                ...g,
                                                items: g.items.map((i) => {
                                                  if (!isBiSet(i) || i.id !== item.id) return i;
                                                  const remaining = i.exercises.filter((e) => e.id !== ex.id);
                                                  if (remaining.length <= 1) return remaining[0] || i;
                                                  return { ...i, exercises: remaining };
                                                }).filter(Boolean) as (WorkoutExercise | BiSet)[],
                                              };
                                            })
                                          );
                                        }}
                                        className="p-1 hover:bg-destructive/20 rounded"
                                      >
                                        <X className="w-3 h-3 text-muted-foreground" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-background/60 border transition-colors ${
                                    selectedItems.has(item.id)
                                      ? "border-primary/50 bg-primary/5"
                                      : "border-transparent hover:border-border"
                                  }`}
                                >
                                  <div {...dragProvided.dragHandleProps}>
                                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                  </div>
                                  <button
                                    onClick={() => toggleSelect(item.id)}
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      selectedItems.has(item.id)
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground/40"
                                    }`}
                                  >
                                    {selectedItems.has(item.id) && (
                                      <span className="text-primary-foreground text-[10px] font-bold">✓</span>
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">{item.exercise.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.exercise.category}</p>
                                  </div>
                                  <button
                                    onClick={() => removeItem(group.id, item.id)}
                                    className="p-1 hover:bg-destructive/20 rounded shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </DragDropContext>

      {hasSelection && (
        <div className="p-3 border-t border-border bg-card">
          <p className="text-xs text-muted-foreground text-center">
            {selectedItems.size} exercícios selecionados — clique em <Link2 className="w-3 h-3 inline text-primary" /> no grupo para criar um Bi-Set
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkoutBuilder;
