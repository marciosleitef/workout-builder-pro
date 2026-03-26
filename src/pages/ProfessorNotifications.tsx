import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Bell, BellOff, Check, CheckCheck, Trash2, Dumbbell, MessageSquare, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  workout_feedback: { icon: Dumbbell, color: "text-blue-500", label: "Treino" },
  challenge: { icon: AlertCircle, color: "text-amber-500", label: "Desafio" },
  feedback: { icon: MessageSquare, color: "text-emerald-500", label: "Feedback" },
  reminder: { icon: Bell, color: "text-muted-foreground", label: "Lembrete" },
};

const ProfessorNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Todas as notificações marcadas como lidas");
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeInfo = (type: string) => typeConfig[type] || typeConfig.reminder;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-primary-foreground font-bold text-lg">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-primary-foreground/50 text-xs">{unreadCount} não lida(s)</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <CheckCheck className="w-4 h-4 mr-1" /> Ler todas
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${filter === "unread" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            Não lidas
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unreadCount}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BellOff className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">{filter === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => {
              const info = getTypeInfo(n.type);
              const Icon = info.icon;
              return (
                <Card
                  key={n.id}
                  className={`transition-colors cursor-pointer ${!n.read ? "border-primary/30 bg-primary/5" : "opacity-75"}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <CardContent className="p-4 flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-secondary"}`}>
                      <Icon className={`w-5 h-5 ${!n.read ? info.color : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm ${!n.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{n.title}</h3>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{n.body}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">{info.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessorNotifications;
