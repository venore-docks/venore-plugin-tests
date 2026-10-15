"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Button, Progress, Textarea, cn } from "@venore/plugin-sdk/ui";
import type { AnswerValue, QuestionnaireAnswers, RunnerContent, RunnerQuestion } from "../content/types";
import type { ModuleRunnerProps } from "../modules/ui-contract";

// RUNNER GENÉRICO de questionário — usado por todo módulo "authored" (Big Five, Conhecimentos,
// Clima…): uma pergunta por tela, os quatro tipos (resposta única, múltipla, escala, texto livre),
// barra de progresso, voltar/avançar, embaralhar perguntas e respostas (configuração do conjunto),
// cronômetro quando há tempo limite, retomar de onde parou e reenviar se o envio falhar. O módulo só
// fornece o conteúdo (editável no admin) e a pontuação; a tela é igual para todos.

type State = { index: number; answers: QuestionnaireAnswers; questionOrder: string[]; optionOrder: Record<string, string[]> };

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOrders(content: RunnerContent): Pick<State, "questionOrder" | "optionOrder"> {
  const ids = content.questions.map((question) => question.id);
  const optionOrder: Record<string, string[]> = {};
  for (const question of content.questions) {
    if (question.options) {
      const optionIds = question.options.map((option) => option.id);
      optionOrder[question.id] = content.settings.shuffleOptions === true ? shuffled(optionIds) : optionIds;
    }
  }
  return { questionOrder: content.settings.shuffleQuestions === true ? shuffled(ids) : ids, optionOrder };
}

// O estado salvo vem do sessionStorage (não confiável): só vale se bater com ESTE conteúdo.
function parseState(value: unknown, content: RunnerContent): State | null {
  const state = value as Partial<State> | null;
  if (!state || typeof state !== "object") return null;
  const ids = content.questions.map((question) => question.id);
  if (!Array.isArray(state.questionOrder) || state.questionOrder.length !== ids.length || !state.questionOrder.every((id) => ids.includes(id))) return null;
  if (!Number.isInteger(state.index) || (state.index as number) < 0 || (state.index as number) >= ids.length) return null;
  if (typeof state.answers !== "object" || state.answers === null || Array.isArray(state.answers)) return null;
  if (typeof state.optionOrder !== "object" || state.optionOrder === null) return null;
  return state as State;
}

function isAnswered(value: AnswerValue | undefined): boolean {
  return value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function QuestionnaireRunner({ contextLabel, onSubmit, error, initialState, onProgress, content, timer }: ModuleRunnerProps) {
  if (!content) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Este teste ainda não tem perguntas publicadas.</p>;
  }
  return <Questionnaire {...{ contextLabel, onSubmit, error, initialState, onProgress, content, timer }} content={content} />;
}

function Questionnaire({ contextLabel, onSubmit, error, initialState, onProgress, content, timer }: ModuleRunnerProps & { content: RunnerContent }) {
  const restored = useMemo(() => parseState(initialState, content), [initialState, content]);
  const [state, setState] = useState<State>(() => restored ?? { index: 0, answers: {}, ...buildOrders(content) });
  const byId = useMemo(() => new Map(content.questions.map((question) => [question.id, question])), [content]);
  const total = content.questions.length;
  const question = byId.get(state.questionOrder[state.index]) as RunnerQuestion;
  const answer = state.answers[question.id];
  const isLast = state.index === total - 1;
  const canAdvance = !question.required || isAnswered(answer);

  // Guarda o progresso a cada passo (a plataforma persiste e apaga ao enviar com sucesso).
  useEffect(() => {
    if (state.index === 0 && Object.keys(state.answers).length === 0) return;
    onProgress?.(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function setAnswer(value: AnswerValue | undefined) {
    setState((current) => {
      const answers = { ...current.answers };
      if (value === undefined) delete answers[question.id];
      else answers[question.id] = value;
      return { ...current, answers };
    });
  }

  // --- cronômetro (só quando há tempo limite) ---
  const offset = useMemo(() => (timer ? Date.parse(timer.serverNow) - Date.now() : 0), [timer]);
  const [remaining, setRemaining] = useState<number | null>(timer ? Math.round((Date.parse(timer.expiresAt) - Date.parse(timer.serverNow)) / 1000) : null);
  const answersRef = useRef(state.answers);
  answersRef.current = state.answers;
  const submittedByTimer = useRef(false);
  useEffect(() => {
    if (!timer) return;
    const tick = () => {
      const left = Math.round((Date.parse(timer.expiresAt) - (Date.now() + offset)) / 1000);
      setRemaining(left);
      if (left <= 0 && !submittedByTimer.current) {
        submittedByTimer.current = true;
        onSubmit(answersRef.current);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, offset]);

  const orderedOptions = (question.options ?? []).slice().sort((a, b) => {
    const order = state.optionOrder[question.id] ?? [];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
  const missingRequired = content.questions.filter((item) => item.required && !isAnswered(state.answers[item.id])).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase text-foreground/50">
        <span>{contextLabel}</span>
        {remaining !== null && (
          <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium normal-case tabular-nums", remaining <= 60 ? "text-destructive" : "text-foreground")} role="timer" aria-label="Tempo restante">
            <Clock className="h-4 w-4" aria-hidden /> {formatClock(remaining)}
          </span>
        )}
      </div>

      <Progress value={Math.round(((state.index + 1) / total) * 100)} />
      <p className="text-end text-xs text-muted-foreground">
        {state.index + 1} / {total}
      </p>

      <fieldset className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6">
        <legend className="sr-only">Pergunta {state.index + 1}</legend>
        <h2 className="text-lg font-medium leading-snug">{question.text}</h2>

        {question.kind === "scale" && content.scale && (
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={question.text}>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${content.scale.points}, minmax(0, 1fr))` }}>
              {Array.from({ length: content.scale.points }, (_, i) => i + 1).map((point) => (
                <button
                  key={point}
                  type="button"
                  role="radio"
                  aria-checked={answer === point}
                  onClick={() => setAnswer(point)}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border px-1 py-2 text-center text-xs transition-colors",
                    answer === point ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent/20",
                  )}
                >
                  <span className="text-base font-semibold">{point}</span>
                  <span className="hidden sm:block">{content.scale?.labels[point - 1]}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground sm:hidden">
              <span>{content.scale.labels[0]}</span>
              <span>{content.scale.labels[content.scale.points - 1]}</span>
            </div>
          </div>
        )}

        {question.kind === "single" && (
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={question.text}>
            {orderedOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={answer === option.id}
                onClick={() => setAnswer(option.id)}
                className={cn("rounded-md border px-4 py-3 text-start text-sm transition-colors", answer === option.id ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-accent/20")}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        {question.kind === "multiple" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Marque todas as que se aplicam.</p>
            {orderedOptions.map((option) => {
              const selected = Array.isArray(answer) && answer.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => {
                    const current = Array.isArray(answer) ? answer : [];
                    const next = selected ? current.filter((id) => id !== option.id) : [...current, option.id];
                    setAnswer(next.length ? next : undefined);
                  }}
                  className={cn("rounded-md border px-4 py-3 text-start text-sm transition-colors", selected ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-accent/20")}
                >
                  <span className="me-2 inline-block w-4 text-center">{selected ? "☑" : "☐"}</span>
                  {option.text}
                </button>
              );
            })}
          </div>
        )}

        {question.kind === "text" && (
          <Textarea value={typeof answer === "string" ? answer : ""} onChange={(event) => setAnswer(event.target.value || undefined)} rows={4} maxLength={2000} placeholder="Escreva aqui" />
        )}

        {!question.required && <p className="text-xs text-muted-foreground">Esta pergunta é opcional.</p>}
      </fieldset>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-panel border border-destructive/40 p-4 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => onSubmit(state.answers)}>
            Tentar enviar de novo
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" disabled={state.index === 0} onClick={() => setState((current) => ({ ...current, index: current.index - 1 }))}>
          Voltar
        </Button>
        {isLast ? (
          <div className="flex flex-col items-end gap-1">
            <Button type="button" disabled={missingRequired > 0} onClick={() => onSubmit(state.answers)}>
              Enviar respostas
            </Button>
            {missingRequired > 0 && <p className="text-xs text-muted-foreground">Faltam {missingRequired} pergunta(s) obrigatória(s) — volte e responda.</p>}
          </div>
        ) : (
          <Button type="button" disabled={!canAdvance} onClick={() => setState((current) => ({ ...current, index: current.index + 1 }))}>
            Próxima
          </Button>
        )}
      </div>
    </div>
  );
}
