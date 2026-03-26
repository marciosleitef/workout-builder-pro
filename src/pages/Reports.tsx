import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Download, Users, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const bom = "\uFEFF";
  const csv = bom + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [exporting, setExporting] = useState<string | null>(null);

  const exportStudents = async () => {
    setExporting("students");
    try {
      const { data } = await supabase.from("students").select("*, student_groups(name), plans(name, price)").eq("professor_id", user!.id).order("full_name");
      if (!data || data.length === 0) { toast.error("Nenhum aluno encontrado"); return; }
      const headers = ["Nome", "E-mail", "Telefone", "WhatsApp", "Gênero", "Nascimento", "Status", "Grupo", "Plano", "Valor Plano", "Dia Pgto", "Cadastro"];
      const rows = data.map(s => [
        s.full_name,
        s.email || "",
        s.phone || "",
        s.whatsapp || "",
        s.gender || "",
        s.birth_date || "",
        s.status || "",
        (s as any).student_groups?.name || "",
        (s as any).plans?.name || "",
        (s as any).plans?.price?.toString() || "",
        s.payment_day?.toString() || "",
        s.registration_date || "",
      ]);
      downloadCSV(`alunos_${format(new Date(), "yyyyMMdd")}.csv`, headers, rows);
      toast.success(`${data.length} alunos exportados!`);
    } catch { toast.error("Erro ao exportar"); } finally { setExporting(null); }
  };

  const exportAttendance = async () => {
    setExporting("attendance");
    try {
      const monthStart = format(startOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");

      const { data: checkins } = await supabase
        .from("workout_checkins")
        .select("*, students(full_name), workouts(name), workout_journeys(name)")
        .eq("professor_id", user!.id)
        .gte("checked_in_at", monthStart)
        .lte("checked_in_at", monthEnd + "T23:59:59")
        .order("checked_in_at", { ascending: false });

      if (!checkins || checkins.length === 0) { toast.error("Nenhum check-in no período"); return; }
      const headers = ["Aluno", "Jornada", "Treino", "Data/Hora Check-in", "Observações"];
      const rows = checkins.map((c: any) => [
        c.students?.full_name || "",
        c.workout_journeys?.name || "",
        c.workouts?.name || "",
        format(new Date(c.checked_in_at), "dd/MM/yyyy HH:mm"),
        c.notes || "",
      ]);
      downloadCSV(`frequencia_${selectedMonth}.csv`, headers, rows);
      toast.success(`${checkins.length} check-ins exportados!`);
    } catch { toast.error("Erro ao exportar"); } finally { setExporting(null); }
  };

  const exportFinancial = async () => {
    setExporting("financial");
    try {
      const monthStart = format(startOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");

      const { data } = await supabase
        .from("payments")
        .select("*, students(full_name)")
        .eq("professor_id", user!.id)
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd)
        .order("due_date");

      if (!data || data.length === 0) { toast.error("Nenhuma cobrança no período"); return; }
      const headers = ["Aluno", "Vencimento", "Valor", "Status", "Data Pgto", "Método", "Observações"];
      const rows = data.map((p: any) => [
        p.students?.full_name || "",
        format(parseISO(p.due_date), "dd/MM/yyyy"),
        p.amount.toFixed(2),
        p.status === "paid" ? "Pago" : (new Date(p.due_date) < new Date() ? "Atrasado" : "Pendente"),
        p.paid_date ? format(parseISO(p.paid_date), "dd/MM/yyyy") : "",
        p.payment_method || "",
        p.notes || "",
      ]);
      downloadCSV(`financeiro_${selectedMonth}.csv`, headers, rows);
      toast.success(`${data.length} cobranças exportadas!`);
    } catch { toast.error("Erro ao exportar"); } finally { setExporting(null); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/60 hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-primary-foreground font-bold text-lg">Relatórios</h1>
            <p className="text-primary-foreground/40 text-xs">Exporte dados em CSV</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* Month selector for attendance/financial */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground">Mês de referência:</label>
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Students */}
          <Card className="hover:border-foreground/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-foreground/70" />
              </div>
              <CardTitle className="text-base">Alunos</CardTitle>
              <CardDescription className="text-xs">Nome, contato, grupo, plano, status</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportStudents} disabled={exporting === "students"} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                {exporting === "students" ? "Exportando..." : "Exportar CSV"}
              </Button>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card className="hover:border-foreground/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-foreground/70" />
              </div>
              <CardTitle className="text-base">Frequência</CardTitle>
              <CardDescription className="text-xs">Check-ins do mês selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportAttendance} disabled={exporting === "attendance"} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                {exporting === "attendance" ? "Exportando..." : "Exportar CSV"}
              </Button>
            </CardContent>
          </Card>

          {/* Financial */}
          <Card className="hover:border-foreground/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 text-foreground/70" />
              </div>
              <CardTitle className="text-base">Financeiro</CardTitle>
              <CardDescription className="text-xs">Cobranças e pagamentos do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportFinancial} disabled={exporting === "financial"} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                {exporting === "financial" ? "Exportando..." : "Exportar CSV"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
