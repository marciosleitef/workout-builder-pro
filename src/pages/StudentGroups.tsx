import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Pencil, Trash2, Users, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Group {
  id: string;
  name: string;
  created_at: string;
  studentCount?: number;
}

const StudentGroups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    setLoading(true);
    const { data: groupsData } = await supabase
      .from("student_groups")
      .select("*")
      .eq("professor_id", user!.id)
      .order("name");

    if (groupsData) {
      const { data: students } = await supabase
        .from("students")
        .select("group_id")
        .eq("professor_id", user!.id);

      const countMap: Record<string, number> = {};
      students?.forEach((s) => {
        if (s.group_id) countMap[s.group_id] = (countMap[s.group_id] || 0) + 1;
      });

      setGroups(groupsData.map((g) => ({ ...g, studentCount: countMap[g.id] || 0 })));
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    const { error } = await supabase
      .from("student_groups")
      .insert({ name: formName.trim(), professor_id: user!.id });
    if (error) {
      toast.error("Erro ao criar grupo");
    } else {
      toast.success("Grupo criado!");
      setFormName("");
      setShowForm(false);
      fetchGroups();
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("student_groups")
      .update({ name: editName.trim() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar grupo");
    } else {
      toast.success("Grupo atualizado!");
      setEditingId(null);
      fetchGroups();
    }
  };

  const handleDelete = async (id: string) => {
    // First unlink students from this group
    await supabase
      .from("students")
      .update({ group_id: null })
      .eq("group_id", id);

    const { error } = await supabase
      .from("student_groups")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao excluir grupo");
    } else {
      toast.success("Grupo excluído!");
      setDeleteConfirm(null);
      fetchGroups();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-[hsl(220,60%,45%)] to-[hsl(250,55%,50%)] px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-display font-bold text-xl">Grupos de Alunos</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{groups.length} grupo(s)</p>
          <Button onClick={() => { setFormName(""); setShowForm(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Novo Grupo
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum grupo criado ainda.</p>
            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-1" /> Criar primeiro grupo
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
              >
                {editingId === group.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(group.id)}
                      autoFocus
                      className="h-9"
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleUpdate(group.id)} className="shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-foreground">{group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.studentCount} aluno(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingId(group.id); setEditName(group.name); }}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(group.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Novo Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Nome do grupo (ex: Musculação, Online...)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <Button onClick={handleCreate} className="w-full" disabled={!formName.trim()}>
              Criar Grupo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Excluir Grupo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Os alunos deste grupo não serão excluídos, apenas desvinculados. Deseja continuar?
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentGroups;
