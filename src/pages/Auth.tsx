import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="fixed bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo area */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold gradient-text mb-1">Método PS</h1>
          <p className="text-lg font-display text-foreground font-semibold">Evolua Além</p>
          <p className="text-sm text-muted-foreground">Gestão Inteligente de Performance</p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "SAÚDE", sub: "Bem-estar", color: "hsl(150 60% 40%)" },
            { label: "EQUILÍBRIO", sub: "Harmonia", color: "hsl(35 90% 55%)" },
            { label: "PERFORMANCE", sub: "Evolução", color: "hsl(0 70% 55%)" },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-xl border border-border bg-card p-4 text-center"
              style={{ borderTopColor: p.color, borderTopWidth: 2 }}
            >
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2"
                style={{ backgroundColor: p.color }}
              />
              <p className="text-xs font-display font-bold text-foreground">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.sub}</p>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { label: "TRAINING", color: "hsl(220 25% 25%)" },
            { label: "FOOD", color: "hsl(30 85% 55%)" },
            { label: "EDUCATION", color: "hsl(200 70% 50%)" },
            { label: "HEALTH", color: "hsl(0 70% 55%)" },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-border bg-card p-3 text-center">
              <div
                className="w-6 h-6 rounded-full mx-auto mb-1.5"
                style={{ backgroundColor: c.color }}
              />
              <p className="text-[10px] font-display font-semibold text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-center mb-6">
            <div className="w-10 h-0.5 bg-muted-foreground/30 mx-auto mb-4 rounded" />
            <h2 className="font-display text-xl font-bold text-foreground">
              {isLogin ? "Acesse sua conta" : "Crie sua conta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Continue sua jornada de evolução" : "Comece sua jornada agora"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Email ou Usuário</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full mt-1 px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {isLogin && (
                <p className="text-xs text-primary text-right mt-1.5 cursor-pointer hover:underline">
                  Esqueceu a senha?
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-display font-bold text-sm text-primary-foreground bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Aguarde..." : isLogin ? "ENTRAR" : "CRIAR CONTA"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Novo no Método PS? " : "Já tem conta? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
