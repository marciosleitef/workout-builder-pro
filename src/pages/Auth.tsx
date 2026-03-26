import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoPS from "@/assets/logo-ps.png";

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
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Detect role and redirect
        const userId = authData.user?.id;
        if (userId) {
          const { data: studentData } = await supabase.from("students").select("id").eq("user_id", userId).limit(1).maybeSingle();
          navigate(studentData ? "/student-dashboard" : "/dashboard");
        } else {
          navigate("/dashboard");
        }
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
    <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <img src={logoPS} alt="PS Logo" className="h-16 mx-auto mb-4 invert-0" />
          <p className="text-sm text-primary-foreground/50 font-display tracking-[0.2em] uppercase">
            Gestão Inteligente de Performance
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "SAÚDE", sub: "Bem-estar" },
            { label: "EQUILÍBRIO", sub: "Harmonia" },
            { label: "PERFORMANCE", sub: "Evolução" },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 text-center backdrop-blur-sm"
            >
              <p className="text-xs font-display font-bold text-primary-foreground">{p.label}</p>
              <p className="text-[10px] text-primary-foreground/40">{p.sub}</p>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 backdrop-blur-sm p-6">
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-bold text-primary-foreground">
              {isLogin ? "Acesse sua conta" : "Crie sua conta"}
            </h2>
            <p className="text-sm text-primary-foreground/40">
              {isLogin ? "Continue sua jornada de evolução" : "Comece sua jornada agora"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-primary-foreground/70">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full mt-1 px-4 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary-foreground/20"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-primary-foreground/70">Email ou Usuário</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full mt-1 px-4 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary-foreground/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-foreground/70">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full mt-1 px-4 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary-foreground/20"
              />
              {isLogin && (
                <p className="text-xs text-primary-foreground/40 text-right mt-1.5 cursor-pointer hover:text-primary-foreground/60 transition-colors">
                  Esqueceu a senha?
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-display font-bold text-sm text-foreground bg-primary-foreground hover:bg-primary-foreground/90 transition-all disabled:opacity-50"
            >
              {loading ? "Aguarde..." : isLogin ? "ENTRAR" : "CRIAR CONTA"}
            </button>
          </form>

          <p className="text-center text-sm text-primary-foreground/40 mt-4">
            {isLogin ? "Novo no Método PS? " : "Já tem conta? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-foreground font-medium hover:underline"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {["TREINO", "ALIMENTAÇÃO", "EDUCAÇÃO", "SAÚDE"].map((c) => (
            <div key={c} className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-2.5 text-center">
              <p className="text-[9px] font-display font-semibold text-primary-foreground/40 tracking-wider">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Auth;
