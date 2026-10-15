"use client";

import { Bar, BarChart, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@venore/plugin-sdk/ui";
import { PercentTooltip, FixedChart } from "../../../../platform/ui/fixed-chart";
import { DISC_LETTER_COLOR, DISC_LETTER_COLOR_INTERNA, DISC_LETTER_LABEL } from "../../engine/colors";
import { ProfileKey } from "../../ui/nestpro-ui";
import type { DiscCount, DiscLetter } from "../../engine/score-disc";

// Tamanho intrínseco do desenho (px). O original media o container na tela (desktop, ~600px) e a
// impressão só encolhia esse SVG — por isso na folha A4 os rótulos saem pequenos. Aqui o tamanho é
// fixo e o SVG escala por CSS (width:100%, height:auto), então tela e impressão ficam deterministas
// sem depender de um re-measure que o navegador não faz antes de imprimir.
const CHART_WIDTH = 605;
const CHART_HEIGHT = 340;

// Eixo X com o nome completo (o original mostrava só D I S C).
const DATA_KEYS = ["d", "i", "s", "c"] as const;

// Portado de nestpro/components/charts/MoreLessBarChartNest — IDÊNTICO ao original, incluindo o
// que parece estranho: cada SÉRIE tem uma cor só (externa = cor da 1ª letra do perfil externo,
// interna = variante clara da 1ª letra do perfil interno), não uma cor por letra DISC. Sem grade,
// sem eixo Y, rótulo "%" acima de cada barra e legenda com os selos de perfil.
export function DiscBarChart({
  more,
  less,
  profileKey,
  profile2ndKey,
  className,
}: {
  more: DiscCount;
  less: DiscCount;
  profileKey: string;
  profile2ndKey: string;
  className?: string;
}) {
  // Cores COM fallback (colors.ts): só o tema nestpro define --disc-color-*; sem fallback, em qualquer
  // outro tema o fill ficava inválido e as barras saíam pretas.
  const letterOf = (key: string): DiscLetter => {
    const letter = key?.[0]?.toLowerCase();
    return letter === "i" || letter === "s" || letter === "c" ? letter : "d";
  };
  const colorMore = DISC_LETTER_COLOR[letterOf(profileKey)];
  const colorLess = DISC_LETTER_COLOR_INTERNA[letterOf(profile2ndKey)];

  const chartData = DATA_KEYS.map((letter) => ({
    key: DISC_LETTER_LABEL[letter],
    more: more[letter] || 0,
    less: less[letter] || 0,
  }));

  const percent = (value: unknown) => `${value}%`;

  return (
    <div className={cn("space-y-8", className)}>
      <FixedChart>
        <BarChart accessibilityLayer data={chartData} width={CHART_WIDTH}
          height={CHART_HEIGHT}
          // Margem no topo: o rótulo "%" fica 12px acima da barra e, com 100%, era cortado pela borda do
          // gráfico (o original, margem 5, tinha o mesmo corte).
          margin={{ top: 28, right: 5, bottom: 5, left: 5 }}
          style={{ width: "100%", height: "auto" }}
        >
          {/* O percentual pode passar de 100 (a fórmula tem teto 102-105): o eixo cresce até o maior valor em vez de cortar a barra. */}
          <YAxis type="number" domain={[0, (dataMax: number) => Math.max(100, dataMax)]} tickCount={0} axisLine hide />
          <XAxis dataKey="key" tickLine={false} tickMargin={10} axisLine={false} fontSize={15} />
          <Tooltip content={<PercentTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
          <Bar dataKey="more" name="Externa" fill={colorMore} radius={3} fillOpacity={1}>
            <LabelList position="top" offset={12} className="fill-foreground" fontSize={14} formatter={percent} />
          </Bar>
          <Bar dataKey="less" name="Interna" fill={colorLess} radius={3} fillOpacity={1}>
            <LabelList position="top" offset={12} className="fill-foreground" fontSize={14} formatter={percent} />
          </Bar>
        </BarChart>
      </FixedChart>
      <div className="flex justify-center gap-3 text-xs lg:text-base">
        <div className="flex items-center gap-3">
          <ProfileKey profileKey={profileKey} className="h-8 w-8 text-base" />
          <span className="text-xs print:text-[8pt]">Autoimagem Externa</span>
        </div>
        <div className="flex items-center gap-3">
          <ProfileKey profileKey={profile2ndKey} className="h-8 w-8 text-base" interna />
          <span className="text-xs print:text-[8pt]">Autoimagem Interna</span>
        </div>
      </div>
    </div>
  );
}
