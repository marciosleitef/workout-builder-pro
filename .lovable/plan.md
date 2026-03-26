

# O que está faltando no app

## Funcionalidades já implementadas
- Dashboard do professor com cards de navegação
- Cadastro e gestão de alunos, grupos, planos
- Biblioteca de exercícios
- Jornadas e treinos (criação pelo professor)
- Calendário de frequência
- Desafios com gamificação
- Bioimpedância e registros diários
- Notificações do professor
- Dashboard do aluno com treino do dia e água
- Treinos do aluno (fluxo completo com check-in/checkout/feedback)
- Histórico do aluno (calendário de presença)
- Saúde do aluno (BIA, gráficos, métricas)
- Desafios do aluno (ranking, pontos)

## O que falta (além do painel financeiro que você já mencionou)

### 1. Painel Financeiro do Professor
- Receita mensal prevista vs recebida
- Lista de alunos inadimplentes (com dias de atraso)
- Próximos vencimentos da semana
- Histórico de pagamentos por aluno
- Tabela `payments` no banco para registrar pagamentos

### 2. Perfil editável do Aluno
- O aluno não consegue editar seus próprios dados (foto, telefone, senha)
- Tela de "Meu Perfil" acessível pela bottom nav ou header

### 3. Notificações do Aluno
- O aluno recebe notificações na tela (Sheet já existe no dashboard), mas falta marcar como lida e ter uma tela dedicada

### 4. Registro diário pelo aluno
- O aluno deveria poder registrar peso, pressão, sono etc. pela tela de saúde (hoje só o professor faz via `DailyTrackingDialog`)

### 5. Relatórios/Exportação para o Professor
- Exportar dados de alunos, frequência, financeiro em CSV/PDF

### 6. Edição de perfil do Professor
- Alterar nome, foto, dados do perfil

---

## Recomendação de prioridade

1. **Painel Financeiro** (tabela `payments` + tela com visão de receita, inadimplentes, vencimentos)
2. **Registro diário pelo aluno** (permitir que o aluno insira peso/pressão/sono na tela de saúde)
3. **Perfil editável** (aluno e professor)
4. **Notificações do aluno** (tela dedicada com marcar como lido)
5. **Relatórios/Exportação**

Quer que eu comece pelo painel financeiro do professor?

