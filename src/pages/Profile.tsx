import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StudentBottomNav from "@/components/StudentBottomNav";
import { ArrowLeft, Camera, User, Mail, Phone, Lock, Save } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (prof) {
      setProfile(prof);
      setFullName(prof.full_name || "");
      setAvatarUrl(prof.avatar_url);
    }

    if (role === "student") {
      const { data: st } = await supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle();
      if (st) {
        setStudent(st);
        setPhone(st.phone || st.whatsapp || "");
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 2MB"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user!.id);
      setAvatarUrl(url);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: profErr } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user!.id);
      if (profErr) throw profErr;

      if (role === "student" && student) {
        await supabase.from("students").update({ phone, whatsapp: phone }).eq("id", student.id);
      }

      toast.success("Perfil atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setShowPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = fullName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(role === "professor" ? "/dashboard" : "/student-dashboard")} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold font-display">Meu Perfil</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <span className="text-2xl font-bold text-muted-foreground">{initials || <User className="h-8 w-8" />}</span>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          {uploading && <p className="text-xs text-muted-foreground">Enviando...</p>}
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> Nome completo</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</Label>
              <Input value={user?.email || ""} disabled className="mt-1 opacity-60" />
            </div>
            {role === "student" && (
              <div>
                <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone/WhatsApp</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" placeholder="(00) 00000-0000" />
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardContent className="p-4">
            <Button variant="outline" className="w-full" onClick={() => setShowPassword(true)}>
              <Lock className="h-3.5 w-3.5 mr-1" /> Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="destructive" className="w-full" onClick={async () => { await signOut(); navigate("/auth"); }}>
          Sair da Conta
        </Button>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPassword} onOpenChange={setShowPassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Alterar Senha</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Confirmar Senha</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full">
              {changingPassword ? "Alterando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {role === "student" && <StudentBottomNav />}
    </div>
  );
};

export default Profile;
