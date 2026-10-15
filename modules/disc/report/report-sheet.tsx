import { DISC_PATTERN_BACKGROUND_URL } from "../engine/disc-pattern-background";
import {
  NestproCard,
  NestproCardContent,
  NestproCardHeader,
  NestproCardTitle,
  ProfileKey,
  ShortDate,
} from "../ui/nestpro-ui";
import { DiscBarChart } from "./charts/disc-bar-chart";
import { DiscStressChart } from "./charts/disc-stress-chart";
import { DiscStressLegend } from "./charts/disc-stress-legend";
import { DiscSurfaceChart } from "./charts/disc-surface-chart";
import { DiscSurfaceLegend } from "./charts/disc-surface-legend";
import { DiscReportPrintStyle } from "./report-print-style";
import { describeDiscProfile } from "../engine/questions";
import type { DiscScoreResult } from "../engine/score-disc";
import type { ModuleReportProps } from "../../../platform/modules/ui-contract";

function InfoItem({ kicker, headline }: { kicker: string; headline: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs">{kicker}</p>
      <h1 className="text-sm font-medium print:text-[10px]">{headline}</h1>
    </div>
  );
}

// A folha do relatório — mesma estrutura do NestPro (nestpro/app/(logged)/reports/r/[reportid]):
// banner, card "Info", perfil, barras, gráfico de superfície, escala de estresse e rodapé. Na
// impressão sai em UMA página A4 (ver report-print-style.tsx); na tela empilha em telas pequenas.
export function DiscReportSheet({ result, footerText }: ModuleReportProps) {
  // dataset foi gerado e validado por scoreDisc na hora do envio (módulo disc, versão result.moduleVersion).
  const dataset = result.dataset as DiscScoreResult;
  const moreProfile = describeDiscProfile(dataset.more.profile);
  const stress = typeof dataset.stress === "number" ? dataset.stress : 0;

  const info: Array<{ kicker: string; headline: string }> = [];
  if (result.identity?.name) info.push({ kicker: "Nome", headline: result.identity.name });
  if (result.identity?.email) info.push({ kicker: "Email", headline: result.identity.email });
  if (result.identity?.teamName) info.push({ kicker: "Equipe", headline: result.identity.teamName });
  info.push({ kicker: "Ambiente", headline: result.contextLabel });

  return (
    <>
    <DiscReportPrintStyle />
    <div className="disc-report flex h-full flex-col justify-between bg-background text-base text-foreground print:h-[calc(297mm-2px)] print:overflow-hidden print:px-4 print:pb-3 print:pt-3">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 print:grid-cols-4 print:gap-3">
        <div className="space-y-6 lg:col-span-4 print:col-span-4">
          <NestproCard
            className="h-24 flex-row justify-between bg-white bg-center py-6"
            style={{ backgroundImage: DISC_PATTERN_BACKGROUND_URL }}
          >
            <div className="flex items-center ps-5 text-5xl font-extrabold uppercase text-black print:ps-4">DISC</div>
          </NestproCard>
          <div className="flex items-center justify-between ps-6">
            <ShortDate value={result.createdAt} className="text-xs text-foreground/50 print:text-[10px]" />
          </div>
        </div>

        <NestproCard className="border-0 bg-primary text-primary-foreground">
          <NestproCardHeader>
            <NestproCardTitle>Info</NestproCardTitle>
          </NestproCardHeader>
          <NestproCardContent className="flex flex-col md:gap-2 print:gap-0">
            {info.map((item) => (
              <InfoItem key={item.kicker} kicker={item.kicker} headline={item.headline} />
            ))}
          </NestproCardContent>
        </NestproCard>

        <NestproCard className="lg:col-span-3 print:col-span-3">
          <NestproCardHeader>
            <NestproCardTitle className="flex gap-3">
              <span className="text-2xl font-bold">{moreProfile?.profile ?? dataset.more.profile.toUpperCase()}</span>
              <ProfileKey profileKey={dataset.more.profile} className="h-8 w-8 rounded text-base" />
            </NestproCardTitle>
          </NestproCardHeader>
          <NestproCardContent className="print:text-[12px]">{moreProfile?.description}</NestproCardContent>
        </NestproCard>

        <NestproCard className="lg:col-span-2 print:col-span-2">
          <NestproCardHeader>
            <NestproCardTitle className="flex flex-row items-center gap-2 print:text-[14px]">Autoimagem Externa e Interna</NestproCardTitle>
          </NestproCardHeader>
          <NestproCardContent className="print:text-[12px]">
            A autoimagem externa reflete o comportamento presente, ordenado pelos estilos predominantes e suas pontuações,
            evidenciando a dinâmica comportamental no ambiente. Enquanto isso, a autoimagem interna revela o comportamento
            desejado, destacando os estilos preferidos e suas pontuações, apontando aspirações e idealizações pessoais.
            <DiscBarChart
              className="p-0 opacity-80 hover:opacity-100"
              more={dataset.more.percentual}
              less={dataset.less.percentual}
              profileKey={dataset.more.profile}
              profile2ndKey={dataset.less.profile}
            />
          </NestproCardContent>
        </NestproCard>

        <NestproCard className="lg:col-span-2 print:col-span-2">
          <NestproCardHeader>
            <NestproCardTitle className="flex flex-row items-center gap-2 print:text-[14px]">Gráfico de superfície</NestproCardTitle>
          </NestproCardHeader>
          <NestproCardContent className="print:px-5 print:pb-0 print:pt-3 print:text-[12px]">
            <DiscSurfaceChart more={dataset.more.percentual} less={dataset.less.percentual} />
            <DiscSurfaceLegend />
          </NestproCardContent>
        </NestproCard>

        <NestproCard className="lg:col-span-4 print:col-span-4 print:pb-3">
          <NestproCardContent className="lg:flex lg:items-center print:flex print:items-center">
            <DiscStressChart value={stress} />
            <div className="space-y-3 lg:col-span-3 print:col-span-3">
              <NestproCardTitle className="flex flex-row items-center gap-2 print:text-[14px]">Escala de Estresse</NestproCardTitle>
              <div className="space-y-3">
                <div className="print:text-[12px]">
                  O objetivo da interpretação do nível de estresse é analisar e compreender o estresse e maneiras de
                  reduzi-lo. O nível de estresse reflete a tensão entre a autoimagem externa e interna, conforme
                  representado nos diagramas.
                </div>
                <div>
                  <DiscStressLegend />
                </div>
              </div>
            </div>
          </NestproCardContent>
        </NestproCard>
      </div>
      {footerText && <div className="text-center text-sm text-foreground/50 lg:col-span-4 print:col-span-4">{footerText}</div>}
    </div>
    </>
  );
}
