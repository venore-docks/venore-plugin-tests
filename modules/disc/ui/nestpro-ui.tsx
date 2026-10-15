import type { ComponentProps } from "react";
import { cn } from "@venore/plugin-sdk/ui";
import { DISC_LETTER_COLOR, DISC_LETTER_COLOR_INTERNA } from "../engine/colors";

// Primitivos visuais do NestPro (nestpro/components/ui/card.tsx, progress.tsx, profilekey) — o
// relatório impresso e o teste têm que sair IDÊNTICOS ao original, e o Card/Progress do core têm
// outra geometria (py-4, ring em vez de border, h-1…). Por isso estes são locais ao plugin, com as
// classes do original, em vez de reutilizar os do SDK. Só tokens shadcn (bg-card, border…) — a cor
// vem do tema; o que precisa de valor fixo na impressão fica em report-print-style.tsx.

export function NestproCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("flex flex-col gap-6 rounded-[13.6px] border bg-card py-6 text-base text-card-foreground shadow-sm", className)}
      {...props}
    />
  );
}

export function NestproCardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1.5 px-6", className)} {...props} />;
}

export function NestproCardTitle({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("font-semibold leading-none", className)} {...props} />;
}

export function NestproCardDescription({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function NestproCardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

export function NestproCardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6", className)} {...props} />;
}

export function NestproProgress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.max(0, value))}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </div>
  );
}

const DISC_FOREGROUND = "var(--disc-color-foreground, hsl(198 15% 97%))";

// Selo do perfil (nestpro/components/ProfileKey): quadrado colorido pela PRIMEIRA letra do perfil,
// com o texto do perfil capitalizado ("sc" → "Sc"). `interna` usa a variante clara + texto escuro.
export function ProfileKey({
  profileKey,
  interna,
  className,
}: {
  profileKey: string | null | undefined;
  interna?: boolean;
  className?: string;
}) {
  const letter = (profileKey?.[0]?.toLowerCase() ?? "") as keyof typeof DISC_LETTER_COLOR | "";
  const known = letter === "d" || letter === "i" || letter === "s" || letter === "c";
  const background = known ? (interna ? DISC_LETTER_COLOR_INTERNA[letter] : DISC_LETTER_COLOR[letter]) : "var(--disc-color-fallback, hsl(198 100% 45%))";
  const color = !known || !interna ? DISC_FOREGROUND : letter === "d" ? "#000" : "#1f2937";

  return (
    <div
      className={cn("flex h-10 w-10 items-center justify-center rounded capitalize", className)}
      style={{ backgroundColor: background, color }}
    >
      {profileKey}
    </div>
  );
}

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// nestpro/components/DateFormatter/ShortDate — "14 de abril de 2026 16:42". O original usava o fuso
// do navegador; aqui o render é no servidor (que roda em UTC), então fixa America/Sao_Paulo.
export function formatShortDate(value: Date | string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("day")} de ${MONTHS[Number(get("month")) - 1]} de ${get("year")}`,
    time: `${Number(get("hour"))}:${get("minute")}`,
  };
}

export function ShortDate({ value, className }: { value: Date | string; className?: string }) {
  const { date, time } = formatShortDate(value);
  return (
    <div className={cn("space-x-1", className)}>
      <span>{date}</span>
      <span className="italic">{time}</span>
    </div>
  );
}

// nestpro/components/ui/spinner.tsx — anel girando da tela "Carregando resultados.".
export function NestproSpinner({ className }: { className?: string }) {
  return (
    <div role="status">
      <svg aria-hidden="true" className={cn("h-8 w-8 animate-spin fill-primary text-foreground/20", className)} viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
