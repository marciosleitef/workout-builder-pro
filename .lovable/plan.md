

# Telas do Aluno e Participante de Desafio

## Visão Geral

Criar um sistema completo de telas para o aluno, com detecção automática de papel (professor vs aluno) no login, e telas específicas para participantes de desafio.

## Arquitetura de Roteamento

Ao fazer login, o sistema detecta se o `user_id` existe na tabela `students`. Se sim, redireciona para `/student-dashboard`. Se não, vai para `/dashboard` (professor).

```text
Login → useAuth detecta role
  ├── Professor → /dashboard (atual)
  └── Aluno → /student-dashboard (novo)
        ├── /student-workouts (treinos do dia)
        ├── /student-history (histórico/presença)
        ├── /student-health (indicadores de saúde)
        └── /student-challenges (desafios)
```

## Banco de Dados

**Tabela `notifications`** (nova):
- `id`, `user_id`, `title`, `body`, `type` (reminder/challenge/payment), `read`, `created_at`
- RLS: usuário vê apenas suas notificações

**Tabela `water_intake`** (nova):
- `id`, `student_id`, `date`, `glasses` (int), `goal` (int, default 8)
- RLS: aluno gerencia seus próprios registros

## Telas do Aluno

### 1. Student Dashboard (`/student-dashboard`)
- Header com nome, avatar e sino de notificações (badge com contagem)
- Card "Treino de Hoje": mostra o treino do dia baseado na jornada ativa (formato semanal → dia da semana, numérico → próximo treino pendente)
- Botão "Iniciar Treino" → abre fluxo de check-in (indicadores pré) → timer → check-out (indicadores pós) → métricas finais
- Card "Consumo de Água": contador visual de copos (toque para adicionar/remover), meta diária configurável
- Card "Indicadores Diários": botão para registrar métricas diárias (peso, pressão, O2, sono, BPM, hidratação) — reutiliza lógica existente do DailyTrackingDialog
- Cards resumo: streak atual, treinos no mês, score saúde/performance
- Bottom navigation: Home | Treinos | Saúde | Desafios

### 2. Treinos (`/student-workouts`)
- Lista de treinos da jornada ativa com status (feito/pendente)
- Cada treino mostra exercícios com vídeos, séries, repetições, carga
- Botão de check-in que dispara o fluxo completo (pré → treino → pós → métricas)

### 3. Histórico e Presença (`/student-history`)
- Calendário mensal com marcações dos dias treinados (heatmap)
- Estatísticas: total de treinos no mês, streak atual, frequência semanal
- Lista de check-ins recentes com detalhes

### 4. Indicadores de Saúde (`/student-health`)
- Scores de Saúde e Performance (barras visuais)
- Últimos registros diários com gráficos de tendência
- Dados de bioimpedância (se houver) com avatar e evolução
- Registro rápido de indicadores diários

### 5. Desafios (`/student-challenges`)
- Lista de desafios que participa com status e posição no ranking
- Ao clicar: ranking completo, seus pontos detalhados, calendário do desafio
- Treinos da jornada do desafio com possibilidade de execução/check-in

### 6. Notificações (Dialog/Sheet)
- "Hoje é dia de treino!" (baseado na jornada ativa)
- "Faltam X dias para o pagamento do plano"
- "Você está no desafio X, fulano passou você no ranking!"
- Geradas por cron ou triggers no banco

## Tela do Participante de Desafio (não-aluno)

Quem se inscreveu via link do desafio sem ser aluno regular:
- Ao logar → detecta que é aluno vinculado a challenge_participants
- Dashboard simplificado com foco no desafio: ranking, treinos da jornada, check-in
- Não tem acesso a indicadores de saúde avançados ou bioimpedância

## Implementação Técnica

### Detecção de Papel
- Adicionar ao `useAuth` uma query que verifica se `user_id` existe em `students`
- Retornar `role: "professor" | "student"` no hook
- `ProtectedRoute` redireciona baseado no role

### Fluxo de Treino do Aluno
- Reutilizar componentes existentes de feedback (DailyTrackingDialog, escalas pré/pós)
- Adaptar para execução pelo próprio aluno (hoje é feito pelo professor)
- Check-in cria registro em `workout_checkins` com `checked_in_by = user_id`

### Notificações
- Edge function schedulada (ou trigger) que gera notificações
- Polling no frontend a cada 60s ou realtime via Supabase channel
- Push notifications futuras via PWA/Capacitor

### Consumo de Água
- Tabela simples, UI de "copos" clicáveis
- Reset diário automático, histórico semanal

## Ordem de Implementação

1. Migração DB (notifications, water_intake) + hook de detecção de role
2. Student Dashboard com navegação bottom bar
3. Tela de treinos com fluxo de check-in autônomo
4. Tela de histórico/presença
5. Tela de indicadores de saúde
6. Tela de desafios do aluno
7. Sistema de notificações
8. Tela simplificada para participante de desafio

