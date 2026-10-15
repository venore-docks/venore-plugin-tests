"use client";

import { PolarRadiusAxis, Radar, RadarChart } from "recharts";
import { FixedChart } from "../../../../platform/ui/fixed-chart";
import { HARTCHART_BACKGROUND_SVG } from "../../engine/hartchart-background";
import { DISC_SURFACE_EXTERNAL_COLOR, DISC_SURFACE_INTERNAL_COLOR } from "../../engine/colors";
import type { DiscCount } from "../../engine/score-disc";

// Tamanho intrínseco do desenho — ver disc-bar-chart.tsx (escala por CSS, não por re-measure).
const CHART_SIZE = 605;

// "Gráfico de superfície" — portado de nestpro/components/charts/DiscChartNest. O fundo era um CSS
// background-image (só imprime com "gráficos de plano de fundo" ligado no navegador); aqui é um
// <svg> real no DOM, atrás do RadarChart via position absolute — imprime sempre, sem depender de
// nenhuma opção do navegador. Visualmente idêntico ao original.
export function DiscSurfaceChart({ more, less }: { more: DiscCount; less: DiscCount }) {
  const chartData = [
    { disc: "Dominância", ext: more.d, int: less.d, fullMark: 100 },
    { disc: "Influência", ext: more.i, int: less.i, fullMark: 100 },
    { disc: "Estabilidade", ext: more.s, int: less.s, fullMark: 100 },
    { disc: "Conformidade", ext: more.c, int: less.c, fullMark: 100 },
  ];

  return (
    <div className="relative aspect-square w-full">
      <div
        className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: HARTCHART_BACKGROUND_SVG }}
      />
      <FixedChart className="absolute inset-0">
        <RadarChart
          cx="50%"
          cy="50%"
          width={CHART_SIZE}
          height={CHART_SIZE}
          style={{ width: "100%", height: "auto" }}
          outerRadius="97%"
          startAngle={45}
          endAngle={-315}
          data={chartData}
        >
          <PolarRadiusAxis domain={[0, 100]} angle={45} tick={false} axisLine={false} />
          <Radar
            name="Externa"
            dataKey="ext"
            fill={DISC_SURFACE_EXTERNAL_COLOR}
            stroke={DISC_SURFACE_EXTERNAL_COLOR}
            strokeWidth={3}
            fillOpacity={0}
            dot={{ r: 5, fillOpacity: 1, fill: "#000" }}
          />
          <Radar
            name="Interna"
            dataKey="int"
            fill={DISC_SURFACE_INTERNAL_COLOR}
            stroke={DISC_SURFACE_INTERNAL_COLOR}
            strokeWidth={3}
            fillOpacity={0}
            dot={{ r: 5, fillOpacity: 1, fill: "#fff" }}
          />
        </RadarChart>
      </FixedChart>
    </div>
  );
}
