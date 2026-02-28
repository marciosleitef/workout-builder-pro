export type MuscleCategory =
  | "Peito"
  | "Costas"
  | "Ombros"
  | "Bíceps"
  | "Tríceps"
  | "Quadríceps"
  | "Posterior"
  | "Glúteos"
  | "Panturrilha"
  | "Abdômen"
  | "Core";

export type SubCategory = "Empurrar" | "Puxar" | "Pernas" | "Core" | "Mobilidade";

export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  subCategory: SubCategory;
  equipment?: string;
}

export const exercises: Exercise[] = [
  // Peito
  { id: "1", name: "Supino Reto com Barra", category: "Peito", subCategory: "Empurrar", equipment: "Barra" },
  { id: "2", name: "Supino Inclinado com Halteres", category: "Peito", subCategory: "Empurrar", equipment: "Halteres" },
  { id: "3", name: "Crucifixo na Máquina", category: "Peito", subCategory: "Empurrar", equipment: "Máquina" },
  { id: "4", name: "Flexão de Braço", category: "Peito", subCategory: "Empurrar", equipment: "Peso corporal" },
  { id: "5", name: "Crossover", category: "Peito", subCategory: "Empurrar", equipment: "Cabo" },
  
  // Costas
  { id: "6", name: "Puxada na Frente", category: "Costas", subCategory: "Puxar", equipment: "Máquina" },
  { id: "7", name: "Remada Curvada", category: "Costas", subCategory: "Puxar", equipment: "Barra" },
  { id: "8", name: "Remada Unilateral", category: "Costas", subCategory: "Puxar", equipment: "Halteres" },
  { id: "9", name: "Pulldown no Cabo", category: "Costas", subCategory: "Puxar", equipment: "Cabo" },
  { id: "10", name: "Barra Fixa", category: "Costas", subCategory: "Puxar", equipment: "Peso corporal" },
  
  // Ombros
  { id: "11", name: "Desenvolvimento com Halteres", category: "Ombros", subCategory: "Empurrar", equipment: "Halteres" },
  { id: "12", name: "Elevação Lateral", category: "Ombros", subCategory: "Empurrar", equipment: "Halteres" },
  { id: "13", name: "Elevação Frontal", category: "Ombros", subCategory: "Empurrar", equipment: "Halteres" },
  { id: "14", name: "Face Pull", category: "Ombros", subCategory: "Puxar", equipment: "Cabo" },
  
  // Bíceps
  { id: "15", name: "Rosca Direta com Barra", category: "Bíceps", subCategory: "Puxar", equipment: "Barra" },
  { id: "16", name: "Rosca Alternada", category: "Bíceps", subCategory: "Puxar", equipment: "Halteres" },
  { id: "17", name: "Rosca Martelo", category: "Bíceps", subCategory: "Puxar", equipment: "Halteres" },
  { id: "18", name: "Rosca Scott", category: "Bíceps", subCategory: "Puxar", equipment: "Barra W" },
  
  // Tríceps
  { id: "19", name: "Tríceps Pulley", category: "Tríceps", subCategory: "Empurrar", equipment: "Cabo" },
  { id: "20", name: "Tríceps Testa", category: "Tríceps", subCategory: "Empurrar", equipment: "Barra" },
  { id: "21", name: "Mergulho no Banco", category: "Tríceps", subCategory: "Empurrar", equipment: "Peso corporal" },
  
  // Quadríceps
  { id: "22", name: "Agachamento Livre", category: "Quadríceps", subCategory: "Pernas", equipment: "Barra" },
  { id: "23", name: "Leg Press", category: "Quadríceps", subCategory: "Pernas", equipment: "Máquina" },
  { id: "24", name: "Cadeira Extensora", category: "Quadríceps", subCategory: "Pernas", equipment: "Máquina" },
  { id: "25", name: "Avanço (Lunge)", category: "Quadríceps", subCategory: "Pernas", equipment: "Halteres" },
  { id: "26", name: "Hack Squat", category: "Quadríceps", subCategory: "Pernas", equipment: "Máquina" },
  
  // Posterior
  { id: "27", name: "Stiff", category: "Posterior", subCategory: "Pernas", equipment: "Barra" },
  { id: "28", name: "Mesa Flexora", category: "Posterior", subCategory: "Pernas", equipment: "Máquina" },
  { id: "29", name: "Cadeira Flexora", category: "Posterior", subCategory: "Pernas", equipment: "Máquina" },
  
  // Glúteos
  { id: "30", name: "Hip Thrust", category: "Glúteos", subCategory: "Pernas", equipment: "Barra" },
  { id: "31", name: "Elevação Pélvica", category: "Glúteos", subCategory: "Pernas", equipment: "Peso corporal" },
  { id: "32", name: "Abdução na Máquina", category: "Glúteos", subCategory: "Pernas", equipment: "Máquina" },
  
  // Panturrilha
  { id: "33", name: "Panturrilha em Pé", category: "Panturrilha", subCategory: "Pernas", equipment: "Máquina" },
  { id: "34", name: "Panturrilha Sentado", category: "Panturrilha", subCategory: "Pernas", equipment: "Máquina" },
  
  // Abdômen
  { id: "35", name: "Abdominal Crunch", category: "Abdômen", subCategory: "Core", equipment: "Peso corporal" },
  { id: "36", name: "Prancha Frontal", category: "Abdômen", subCategory: "Core", equipment: "Peso corporal" },
  { id: "37", name: "Prancha Lateral", category: "Abdômen", subCategory: "Core", equipment: "Peso corporal" },
  { id: "38", name: "Abdominal Infra", category: "Abdômen", subCategory: "Core", equipment: "Peso corporal" },
  
  // Core
  { id: "39", name: "Roda Abdominal", category: "Core", subCategory: "Core", equipment: "Roda" },
  { id: "40", name: "Dead Bug", category: "Core", subCategory: "Core", equipment: "Peso corporal" },
  
  // Mobilidade
  { id: "41", name: "Alongamento de Ombro", category: "Ombros", subCategory: "Mobilidade" },
  { id: "42", name: "Rotação Torácica", category: "Costas", subCategory: "Mobilidade" },
  { id: "43", name: "Agachamento Profundo (Mobilidade)", category: "Quadríceps", subCategory: "Mobilidade" },
];

export const muscleCategories: MuscleCategory[] = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps",
  "Quadríceps", "Posterior", "Glúteos", "Panturrilha", "Abdômen", "Core",
];

export const subCategories: SubCategory[] = [
  "Empurrar", "Puxar", "Pernas", "Core", "Mobilidade",
];
