import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Package } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  periodicity: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlansChanged?: () => void;
}

const PERIODICITY_LABELS: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

const PlansDialog = ({ open, onOpenChange, onPlansChanged }: Props) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: "", price: "", periodicity: "monthly" });

  useEffect(() => {
    if (open && user) fetchPlans();
  }, [open, user]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("professor_id", user!.id)
      .order("name");
    setPlans((data as any[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const price = parseFloat(form.price) || 0;

    if (editingPlan) {
      const { error } = await supabase
        .from("plans")
        .update({ name: form.name, price, periodicity: form.periodicity } as any)
        .eq("id", editingPlan.id);
      if (error) toast.error("Erro ao atualizar plano");
      else { toast.success("Plano atualizado!"); }
    } else {
      const { error } = await supabase
        .from("plans")
        .insert({ name: form.name, price, periodicity: form.periodicity, professor_id: user!.id } as any);
      if (error) toast.error("Erro ao criar plano");
      else { toast.success("Plano criado!"); }
    }
    setShowForm(false);
    setEditingPlan(null);
    setForm({ name: "", price: "", periodicity: "monthly" });
    fetchPlans();
    onPlansChanged?.();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) toast.error("Erro ao remover plano");
    else { toast.success("Plano removido!"); fetchPlans(); onPlansChanged?.(); }
  };

  const openEdit = (p: Plan) => {
    setEditingPlan(p);
    setForm({ name: p.name, price: String(p.price), periodicity: p.periodicity });
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Gerenciar Planos
          </DialogTitle>
        </DialogHeader>

        {showForm ? (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do Plano *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Mensal Premium" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Valor (R$)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="150.00" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Periodicidade</label>
              <select value={form.periodicity} onChange={(e) => setForm({ ...form, periodicity: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {Object.entries(PERIODICITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setEditingPlan(null); }} className="px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors">
                {editingPlan ? "Salvar" : "Criar Plano"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <button onClick={() => { setEditingPlan(null); setForm({ name: "", price: "", periodicity: "monthly" }); setShowForm(true); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/30 transition-colors">
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Novo Plano</span>
            </button>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Nenhum plano cadastrado</p>
            ) : (
              plans.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {Number(p.price).toFixed(2)} • {PERIODICITY_LABELS[p.periodicity] || p.periodicity}
                    </p>
                  </div>
                  <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlansDialog;
