import type { CSSProperties } from "react";
import type { ColorTheme, CoverLayout, FontStyle, GalleryDesign } from "./types";

type Palette = Record<"background" | "surface" | "foreground" | "muted" | "line" | "accent" | "accent-strong" | "accent-soft", string>;

export const themes: Record<ColorTheme, { label: string; palette: Palette }> = {
  areia: {
    label: "Areia",
    palette: { background: "#faf8f5", surface: "#ffffff", foreground: "#2b2724", muted: "#8a817a", line: "#e9e4de", accent: "#9c7b5b", "accent-strong": "#7d6045", "accent-soft": "#f3ece4" },
  },
  branco: {
    label: "Branco",
    palette: { background: "#ffffff", surface: "#fafafa", foreground: "#1d1d1d", muted: "#777777", line: "#e8e8e8", accent: "#1d1d1d", "accent-strong": "#000000", "accent-soft": "#f1f1f1" },
  },
  noite: {
    label: "Noite",
    palette: { background: "#141414", surface: "#1f1f1f", foreground: "#f2eee9", muted: "#a39d96", line: "#2f2f2f", accent: "#c9a27e", "accent-strong": "#e3bd98", "accent-soft": "#2a2520" },
  },
  oliva: {
    label: "Oliva",
    palette: { background: "#f6f7f4", surface: "#ffffff", foreground: "#243d35", muted: "#68736c", line: "#e0e6df", accent: "#527561", "accent-strong": "#345641", "accent-soft": "#e9efe6" },
  },
  rose: {
    label: "Rosé",
    palette: { background: "#fbf6f5", surface: "#ffffff", foreground: "#3a2a2c", muted: "#8f7b7d", line: "#efe2e1", accent: "#b07a7f", "accent-strong": "#8e5a60", "accent-soft": "#f6e9e8" },
  },
};

export const fontLabels: Record<FontStyle, string> = { classica: "Clássica (serifada)", moderna: "Moderna (sem serifa)" };
export const coverLabels: Record<CoverLayout, string> = { centro: "Foto inteira", lateral: "Foto ao lado", minimal: "Só texto" };

export const defaultDesign = (): GalleryDesign => ({ theme: "areia", font: "classica", cover: "centro" });

/**
 * Variáveis CSS que trocam as cores (e a fonte dos títulos) só dentro da área do cliente.
 * Funciona porque os utilitários do Tailwind leem essas mesmas variáveis.
 */
export function designStyle(design: GalleryDesign): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(themes[design.theme].palette)) vars[`--${key}`] = value;
  if (design.font === "moderna") vars["--font-cormorant"] = "var(--font-inter)";
  return { ...vars, background: "var(--background)", color: "var(--foreground)" } as CSSProperties;
}
