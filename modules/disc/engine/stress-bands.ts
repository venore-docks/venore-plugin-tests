// Faixas da "Escala de Estresse" (nestpro PieChartNest360 + @stress/legend): limite, rótulo e cor
// ficam num lugar só, usadas pelo gráfico (client) e pela legenda (server). Módulo sem a diretiva de client
// de propósito: exportar isto de um arquivo client faz o servidor receber uma referência em vez do
// array e quebrar (`.map is not a function`).
export const DISC_STRESS_BANDS = [
  { max: 40, label: "Baixa", range: "0-40", color: "#FACC15", legend: "bg-yellow-400" },
  { max: 60, label: "Média", range: "41-60", color: "#FB923C", legend: "bg-orange-400" },
  { max: 80, label: "Alta", range: "61-80", color: "#EF4444", legend: "bg-red-500" },
  { max: Infinity, label: "Muito alta", range: "acima de 80", color: "#E11D48", legend: "bg-red-700" },
] as const;
