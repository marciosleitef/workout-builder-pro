import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Pencil, Trash2, Package, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  price: number;
  periodicity: string;
  studentCount?: number;
}

const PERIODICITY_LABELS: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formPeriodicity, setFormPeriodicity] = useState("monthly");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPeriodicity, setEditPeriodicity] = useState("monthly");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data: plansData } = await supabase
      .from("plans")
      .select("*")
      .eq("professor_id", user!.id)
      .order("name");

    if (plansData) {
      const { data: students } = await supabase
        .from("students")
        .select("plan_id")
        .eq("professor_id", user!.id);

      const countMap: Record<string, number> = {};
      students?.forEach((s) => {
        if (s.plan_id) countMap[s.plan_id] = (countMap[s.plan_id] || 0) + 1;
      });

      setPlans(plansData.map((p) => ({ ...p, studentCount: countMap[p.id] || 0 })));
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    const price = parseFloat(formPrice) || 0;
    const { error } = await supabase
      .from("plans")
      .insert({ name: formName.trim(), price, periodicity: formPeriodicity, professor_id: user!.id });
    if (error) {
      toast.error("Erro ao criar plano");
    } else {
      toast.success("Plano criado!");
      setFormName("");
      setFormPrice("");
      setFormPeriodicity("monthly");
      setShowForm(false);
      fetchPlans();
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    const price = parseFloat(editPrice) || 0;
    const { error } = await supabase
      .from("plans")
      .update({ name: editName.trim(), price, periodicity: editPeriodicity })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar plano");
    } else {
      toast.success("Plano atualizado!");
      setEditingId(null);
      fetchPlans();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("students").update({ plan_id: null }).eq("plan_id", id);
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir plano");
    } else {
      toast.success("Plano excluído!");
      setDeleteConfirm(null);
      fetchPlans();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-primary-foreground font-display font-bold text-xl">Planos</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{plans.length} plano(s)</p>
          <Button onClick={() => { setFormName(""); setFormPrice(""); setFormPeriodicity("monthly"); setShowForm(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Novo Plano
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum plano criado ainda.</p>
            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-1" /> Criar primeiro plano
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
              >
                {editingId === plan.id ? (
                  <div className="flex-1 mr-3 space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome do plano"
                      autoFocus
                      className="h-9"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Valor"
                        className="h-9"
                      />
                      <select
                        value={editPeriodicity}
                        onChange={(e) => setEditPeriodicity(e.target.value)}
                        className="h-9 px-3 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {Object.entries(PERIODICITY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(plan.id)}>
                        <Check className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(30,80%,55%)]/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-[hsl(30,80%,55%)]" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-foreground">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {Number(plan.price).toFixed(2)} • {PERIODICITY_LABELS[plan.periodicity] || plan.periodicity} • {plan.studentCount} aluno(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(plan.id);
                          setEditName(plan.name);
                          setEditPrice(String(plan.price));
                          setEditPeriodicity(plan.periodicity);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(plan.id)}
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
          <DialogHeader><DialogTitle className="font-display">Novo Plano</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Nome do plano (ex: Mensal Premium)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
            />
            <select
              value={formPeriodicity}
              onChange={(e) => setFormPeriodicity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {Object.entries(PERIODICITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Button onClick={handleCreate} className="w-full" disabled={!formName.trim()}>
              Criar Plano
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Excluir Plano</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Os alunos com este plano não serão excluídos, apenas desvinculados do plano. Deseja continuar?
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

export default Plans;
