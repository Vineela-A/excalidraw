export interface CursorLabelColor {
  fill: string;
  accent: string;
}

export const CURSOR_LABEL_TEXT_COLOR = "#1e293b";

export const CURSOR_LABEL_COLORS: readonly CursorLabelColor[] = [
  { fill: "#93c5fd", accent: "#2563eb" },
  { fill: "#5eead4", accent: "#0d9488" },
  { fill: "#86efac", accent: "#16a34a" },
  { fill: "#fcd34d", accent: "#d97706" },
  { fill: "#fda4af", accent: "#e11d48" },
  { fill: "#d8b4fe", accent: "#9333ea" },
  { fill: "#7dd3fc", accent: "#0284c7" },
  { fill: "#fdba74", accent: "#ea580c" },
  { fill: "#bef264", accent: "#65a30d" },
  { fill: "#f0abfc", accent: "#c026d3" },
];

export const pickCursorLabelColor = (hash: number): CursorLabelColor =>
  CURSOR_LABEL_COLORS[Math.abs(hash) % CURSOR_LABEL_COLORS.length];
