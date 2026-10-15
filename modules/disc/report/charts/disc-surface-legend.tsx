import { DISC_SURFACE_EXTERNAL_COLOR, DISC_SURFACE_INTERNAL_COLOR } from "../../engine/colors";

// Legenda do gráfico de superfície (o original não tinha): externa = traço branco com pontos
// pretos, interna = traço preto com pontos brancos — mesmos valores do DiscSurfaceChart. O fundo
// cinza do chip é o cinza da moldura do hartchart, senão o traço branco sumiria no papel branco.
function Swatch({ stroke, dot }: { stroke: string; dot: string }) {
  return (
    <svg aria-hidden width="40" height="16" viewBox="0 0 40 16" className="shrink-0">
      <rect width="40" height="16" rx="3" fill="#898984" />
      <line x1="6" y1="8" x2="34" y2="8" stroke={stroke} strokeWidth="3" />
      <circle cx="6" cy="8" r="3.5" fill={dot} stroke={stroke} strokeWidth="1" />
      <circle cx="34" cy="8" r="3.5" fill={dot} stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

export function DiscSurfaceLegend() {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs print:mt-1 print:text-[8pt]">
      <div className="flex items-center gap-3">
        <Swatch stroke={DISC_SURFACE_EXTERNAL_COLOR} dot="#000" />
        <span>Autoimagem Externa</span>
      </div>
      <div className="flex items-center gap-3">
        <Swatch stroke={DISC_SURFACE_INTERNAL_COLOR} dot="#fff" />
        <span>Autoimagem Interna</span>
      </div>
    </div>
  );
}
