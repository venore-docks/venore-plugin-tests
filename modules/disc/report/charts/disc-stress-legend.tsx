import { DISC_STRESS_BANDS } from "../../engine/stress-bands";

// nestpro/app/(logged)/reports/r/[reportid]/@stress/legend.tsx
export function DiscStressLegend() {
  return (
    <>
      <div className="text-sm text-foreground/60 print:text-[8px]">Legenda: </div>
      <div className="space-x-3 text-sm text-foreground/60 lg:flex print:flex print:text-[8px]">
        {DISC_STRESS_BANDS.map((band) => (
          <div key={band.label} className="flex items-center space-x-3">
            <div className={`h-3 w-8 rounded ${band.legend}`} />
            <div>
              {band.label} ({band.range})
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
