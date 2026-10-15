"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, cn } from "@venore/plugin-sdk/ui";
import type { ModuleRunnerProps } from "../../../platform/modules/ui-contract";
import { DISC_HOWTO, DISC_QUESTIONS } from "../engine/questions";
import { shuffleInPlace } from "../engine/shuffle";
import type { RawDiscInput } from "../engine/score-disc";
import {
  NestproCard,
  NestproCardContent,
  NestproCardDescription,
  NestproCardFooter,
  NestproCardHeader,
  NestproCardTitle,
  NestproProgress,
} from "../ui/nestpro-ui";

// Estado serializável para retomar o teste (a plataforma guarda no sessionStorage).
type DiscRunnerState = { current: number; moreLess: boolean; wasSelected: string; rawInput: RawDiscInput };

const TOTAL = DISC_QUESTIONS.length;

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value !== null && Object.values(value).every((item) => typeof item === "string");
}

// O que veio do sessionStorage NÃO é confiável: só aceita se tiver exatamente o formato esperado.
function parseState(value: unknown): DiscRunnerState | null {
  const state = value as Partial<DiscRunnerState> | null;
  if (!state || typeof state !== "object") return null;
  if (!Number.isInteger(state.current) || (state.current as number) < 0 || (state.current as number) >= TOTAL) return null;
  if (typeof state.moreLess !== "boolean" || typeof state.wasSelected !== "string") return null;
  if (!state.rawInput || !isStringRecord(state.rawInput.more) || !isStringRecord(state.rawInput.less)) return null;
  return state as DiscRunnerState;
}

// Runner portado de nestpro/components/MoreLess/index.tsx + cards/AssessmentRun.tsx — mesmo fluxo de
// "mais provável" seguido de "menos provável" por pergunta (opção já marcada como "mais" fica
// desabilitada na rodada "menos"), e a MESMA tela: card com borda azul (mais) / vermelha (menos),
// selo numerado no canto, barra de progresso + contador, opções em linhas com hover colorido,
// "Preciso de ajuda?" e "Voltar uma questão" no rodapé. A ordem das opções embaralha uma vez por
// pergunta (useMemo), não a cada re-render como o original (que mutava o array).
//
// Melhorias de UX sobre o original (plano de UX, fase 3): dá para voltar também na rodada "menos"
// (volta ao "mais" da mesma pergunta), o progresso é guardado/retomado e, se o envio falhar, um botão
// reenvia as mesmas respostas. Enviar, "calculando…" e navegação são da plataforma (ModuleRunnerHost).
export function DiscRunner({ contextLabel, onSubmit, error, initialState, onProgress }: ModuleRunnerProps) {
  const restored = useMemo(() => parseState(initialState), [initialState]);
  const [current, setCurrent] = useState(restored?.current ?? 0);
  const [moreLess, setMoreLess] = useState(restored?.moreLess ?? true);
  const [wasSelected, setWasSelected] = useState(restored?.wasSelected ?? "");
  const [rawInput, setRawInput] = useState<RawDiscInput>(restored?.rawInput ?? { more: {}, less: {} });

  const question = DISC_QUESTIONS[current];
  const options = useMemo(() => shuffleInPlace([...question.options]), [current]);
  // O original numerava a partir de 1 (o índice 0 do banco era o cabeçalho de versão) e mostrava
  // "n / 20" com progresso n*5 — mantém os mesmos números.
  const questionNumber = current + 1;

  // Guarda o progresso a cada passo (a plataforma persiste e apaga ao enviar com sucesso).
  useEffect(() => {
    // Não guarda o estado "zerado" (nada respondido ainda): retomar não faria sentido.
    if (current === 0 && moreLess && Object.keys(rawInput.more).length === 0) return;
    onProgress?.({ current, moreLess, wasSelected, rawInput } satisfies DiscRunnerState);
    // onProgress é estável o bastante: só queremos reagir ao estado do teste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, moreLess, wasSelected, rawInput]);

  function handleSelect(value: string) {
    const key = String(questionNumber);
    const nextRawInput: RawDiscInput = moreLess
      ? { ...rawInput, more: { ...rawInput.more, [key]: value } }
      : { ...rawInput, less: { ...rawInput.less, [key]: value } };

    setRawInput(nextRawInput);
    setWasSelected(value);

    if (!moreLess) {
      setMoreLess(true);
      setWasSelected("");
      if (current < TOTAL - 1) {
        setCurrent(current + 1);
        return;
      }
      onSubmit(nextRawInput);
      return;
    }

    setMoreLess(false);
  }

  // Na rodada "menos": volta ao "mais" da MESMA pergunta (a escolha de "mais" é refeita). Na rodada
  // "mais": volta à pergunta anterior.
  function handleBack() {
    if (!moreLess) {
      setMoreLess(true);
      setWasSelected("");
      return;
    }
    if (current > 0) setCurrent(current - 1);
  }

  const [headerStart, headerMiddle, headerEnd] = question.header.split("{split}");
  const moreLessLabel = moreLess ? <span className="font-bold text-primary">mais</span> : <span className="font-bold text-destructive">menos</span>;
  const answeredAll = Object.keys(rawInput.more).length === TOTAL && Object.keys(rawInput.less).length === TOTAL;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col space-y-4 py-8">
      <div className="flex space-x-4 text-xs uppercase text-foreground/50">
        <div>DISC</div>
        <div>{contextLabel}</div>
      </div>

      <NestproCard className={cn("relative border p-0", moreLess ? "border-primary" : "border-destructive")}>
        <div
          className={cn(
            "absolute -left-2 -top-2 flex h-[30px] w-[30px] items-center justify-center rounded-md text-white",
            moreLess ? "bg-primary" : "bg-destructive",
          )}
        >
          {questionNumber}
        </div>
        <NestproCardHeader>
          <NestproCardTitle className="font-normal">
            <div className="p-4 text-xl">
              <span>{headerStart}</span>
              <span>{contextLabel}</span>
              <span>{headerMiddle}</span>
              {moreLessLabel}
              <span>{headerEnd}</span>
            </div>
          </NestproCardTitle>
        </NestproCardHeader>
        <NestproProgress value={questionNumber * 5} />
        <NestproCardDescription className="flex justify-end px-10">
          {questionNumber} / {TOTAL}
        </NestproCardDescription>
        <NestproCardContent>
          <div>
            {options.map((option) => {
              const disabled = !moreLess && option.value === wasSelected;
              return (
                <div key={option.value + option.text}>
                  <input
                    type="radio"
                    id={`disc-option-${option.value}`}
                    name="disc-option"
                    className="sr-only"
                    value={option.value}
                    checked={false}
                    disabled={disabled}
                    onChange={() => handleSelect(option.value)}
                  />
                  <label
                    htmlFor={`disc-option-${option.value}`}
                    className={cn(
                      // Celular: linha mais folgada (o original, leading-none, apertava textos que quebram).
                      "block cursor-pointer select-none rounded px-4 py-4 text-sm font-medium leading-snug sm:py-5 sm:leading-none",
                      moreLess ? "hover:bg-primary hover:text-primary-foreground" : "hover:bg-destructive hover:text-destructive-foreground",
                      disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-foreground",
                    )}
                  >
                    {option.text}
                  </label>
                </div>
              );
            })}
          </div>
        </NestproCardContent>
        <NestproCardFooter className="border-t p-0">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 p-6 sm:p-9">
            <Dialog>
              <DialogTrigger className="cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Info className="h-6 w-6" />
                  <div>Preciso de ajuda?</div>
                </div>
              </DialogTrigger>
              <DialogContent className="p-10">
                <DialogHeader className="space-y-10">
                  <DialogTitle>{DISC_HOWTO.title}</DialogTitle>
                  <div className="space-y-3 text-pretty text-base" dangerouslySetInnerHTML={{ __html: DISC_HOWTO.content }} />
                </DialogHeader>
                <DialogFooter className="sm:justify-end">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Fechar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="secondary" onClick={handleBack} disabled={moreLess && current === 0}>
              Voltar uma questão
            </Button>
          </div>
        </NestproCardFooter>
      </NestproCard>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-panel border border-destructive/40 p-4 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          {answeredAll && (
            <Button type="button" size="sm" variant="outline" onClick={() => onSubmit(rawInput)}>
              Tentar enviar de novo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
