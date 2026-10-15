"use client";

import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { DISC_STRESS_BANDS } from "../../engine/stress-bands";
import { FixedChart } from "../../../../platform/ui/fixed-chart";

// O original pedia outerRadius=150 num container de 200px de altura; o recharts 2 limitava o raio
// ao máximo que cabe ((200 - 2×5 de margem) / 2 = 95) e o v3 não limita (cortaria o anel). 95 é o
// raio que o original efetivamente desenhava.
const OUTER_RADIUS = 97;
const INNER_RADIUS = 63.5;

// Portado de nestpro/components/charts/PieChartNest360 — anel radial com o valor no centro e o
// nível por faixa de cor. A trilha cinza é `140 - value` (e não 100) como no original: é o que
// dá o desenho do arco quando o anel não fecha em 100.
export function DiscStressChart({ value }: { value: number }) {
  const stress = Number.isFinite(value) ? value : 0;
  const band = stress === 0 ? undefined : DISC_STRESS_BANDS.find((candidate) => stress <= candidate.max);
  const chartData = [{ month: "january", stress, gray: 140 - stress }];

  return (
    <FixedChart className="mx-auto max-w-[250px]">
      <RadialBarChart data={chartData} width={250} height={200} style={{ width: "100%", height: "auto" }} endAngle={360} innerRadius={INNER_RADIUS} outerRadius={OUTER_RADIUS}>
        {/* domínio fixo [0, 140] = valor + trilha (a soma empilhada): o recharts 2 usava o total da pilha, o
            v3 usa o maior valor individual e fecharia o arco em 57/83 da volta em vez de 57/140. */}
        <PolarAngleAxis type="number" domain={[0, 140]} tick={false} axisLine={false} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy || 0} className="fill-foreground text-3xl font-bold">
                      {stress.toLocaleString()}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-base">
                      {band?.label ?? ""}
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </PolarRadiusAxis>
        <RadialBar dataKey="stress" stackId="a" cornerRadius={0} fill={band?.color ?? ""} />
        <RadialBar dataKey="gray" fill="#AAA" stackId="a" opacity={0.2} />
      </RadialBarChart>
    </FixedChart>
  );
}
