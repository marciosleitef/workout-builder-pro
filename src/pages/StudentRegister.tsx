import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface StudentGroup {
  id: string;
  name: string;
}

const StudentRegister = () => {
  const { professorId } = useParams<{ professorId: string }>();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (professorId) {
      supabase
        .from("student_groups")
        .select("id, name")
        .eq("professor_id", professorId)
        .order("name")
        .then(({ data }) => setGroups((data as any[]) || []));
    }
  }, [professorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("register-student", {
        body: { professorId, fullName, email, whatsapp, birthDate, gender, groupId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-border bg-card p-8">
            <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Cadastro Realizado!</h1>
            <p className="text-muted-foreground mb-4">
              Sua conta foi criada com sucesso. Use seu email e a senha padrão <strong className="text-foreground">123456</strong> para fazer o primeiro login.
            </p>
            <p className="text-sm text-muted-foreground">
              Você será solicitado a trocar sua senha no primeiro acesso.
            </p>
            <a
              href="/auth"
              className="mt-6 inline-block w-full py-3 rounded-lg font-display font-bold text-sm text-primary-foreground bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-center"
            >
              IR PARA LOGIN
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-[-10%] left-[-5%] w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="fixed bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold gradient-text mb-1">Método PS</h1>
          <p className="text-lg font-display text-foreground font-semibold">Cadastro de Aluno</p>
          <p className="text-sm text-muted-foreground">Preencha seus dados para começar</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome Completo *</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" required className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">E-mail *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            {groups.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground">Selecione um Grupo</label>
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Selecione</option>
                  {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Data de Nascimento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">WhatsApp</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Gênero</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              Após o cadastro, sua senha inicial será <strong className="text-foreground">123456</strong>. Você deverá trocá-la no primeiro acesso.
            </p>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-display font-bold text-sm text-primary-foreground bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "CADASTRANDO..." : "CADASTRAR"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
