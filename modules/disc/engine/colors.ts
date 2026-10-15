// Cores da metodologia DISC (D=vermelho, I=amarelo, S=verde, C=azul) são convenção do domínio, não
// decoração arbitrária — por isso ficam aqui como var() COM fallback, em vez de token shadcn
// genérico (bg-card, text-muted-foreground...): um tema pode sobrescrever --disc-color-* se quiser
// (o tema nestpro define exatamente esses valores), mas sem tema nenhum instalado o gráfico ainda
// sai correto, com as mesmas cores do NestPro original (nestpro/app/globals.css).
export const DISC_LETTER_COLOR = {
  d: "var(--disc-color-d, hsl(340 70% 40%))",
  i: "var(--disc-color-i, hsl(40 100% 48%))",
  s: "var(--disc-color-s, hsl(150 70% 40%))",
  c: "var(--disc-color-c, hsl(198 100% 45%))",
} as const;

export const DISC_LETTER_COLOR_INTERNA = {
  d: "var(--disc-color-d-interna, hsl(340 70% 60%))",
  i: "var(--disc-color-i-interna, hsl(40 50% 80%))",
  s: "var(--disc-color-s-interna, hsl(150 70% 80%))",
  c: "var(--disc-color-c-interna, hsl(198 50% 80%))",
} as const;

// Traço externo/interno do gráfico de superfície — branco/preto no NestPro original
// (components/charts/DiscChartNest), sem relação com as cores por letra acima.
export const DISC_SURFACE_EXTERNAL_COLOR = "var(--disc-surface-external, #ffffff)";
export const DISC_SURFACE_INTERNAL_COLOR = "var(--disc-surface-internal, #111111)";

export const DISC_LETTER_LABEL = { d: "Dominância", i: "Influência", s: "Estabilidade", c: "Conformidade" } as const;
