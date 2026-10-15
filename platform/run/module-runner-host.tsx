"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { startAttemptAction, submitAttemptAction } from "../../routes/run/actions";
import type { RunnerContent } from "../content/types";
import { getModuleRunner } from "../modules/runner-registry";
import { clearSavedRun, savedRunKey, writeSavedRun } from "./saved-run";

export type RunnerParticipant = { name: string; email: string };

type Clock = { attemptId: string; expiresAt: string; serverNow: string };

// Hospedeiro do runner de um módulo: o módulo desenha as perguntas e chama onSubmit(respostas) no
// fim; aqui ficam o envio, o "calculando…", o erro, a navegação para o resultado, a guarda/retomada
// do progresso e a TENTATIVA com tempo limite — iguais para todo módulo (regra do contrato: o runner
// não sabe de rede nem de rotas). O runner continua montado durante o envio (só um véu por cima)
// para não perder o estado se o envio falhar.
export function ModuleRunnerHost({
  moduleId,
  instanceId,
  contextLabel,
  participant,
  content,
  initialRunnerState,
  initialAttemptId,
}: {
  moduleId: string;
  instanceId: string | null;
  contextLabel: string;
  participant: RunnerParticipant | null;
  // Módulos authored: as perguntas (sem gabarito). Nulo no DISC.
  content: RunnerContent | null;
  // Estado salvo de uma visita anterior (ver saved-run.ts); o runner do módulo o valida.
  initialRunnerState?: unknown;
  initialAttemptId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState<Clock | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const Runner = getModuleRunner(moduleId);
  const storageKey = savedRunKey(moduleId, instanceId);
  const timeLimit = content && typeof content.settings.timeLimitMinutes === "number" ? content.settings.timeLimitMinutes : 0;
  const needsAttempt = timeLimit > 0;

  // Teste com tempo limite: abre (ou retoma) a tentativa no servidor antes de mostrar a primeira pergunta.
  useEffect(() => {
    if (!needsAttempt || !content) return;
    let cancelled = false;
    startAttemptAction({ moduleId, instanceId, contentRef: { setId: content.setId, version: content.version }, existingAttemptId: initialAttemptId ?? null }).then((result) => {
      if (cancelled) return;
      if (!result.success) setAttemptError(result.error.message);
      else if (result.data) setClock(result.data);
    });
    return () => {
      cancelled = true;
    };
    // abre UMA vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attemptId = clock?.attemptId ?? null;
  const handleProgress = useCallback(
    (runnerState: unknown) => {
      writeSavedRun(storageKey, { contextLabel, participant, runnerState, attemptId });
    },
    [storageKey, contextLabel, participant, attemptId],
  );

  if (!Runner) {
    return <p className="py-16 text-center text-sm text-destructive">Este teste não está disponível.</p>;
  }
  if (attemptError) {
    return <p className="py-16 text-center text-sm text-destructive">{attemptError}</p>;
  }
  if (needsAttempt && !clock) {
    return (
      <div className="flex flex-col items-center gap-4 py-16" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Preparando o teste…</p>
      </div>
    );
  }

  function handleSubmit(answers: unknown) {
    setError(null);
    startTransition(async () => {
      const result = await submitAttemptAction({
        moduleId,
        answers,
        instanceId,
        contextLabel: instanceId ? null : contextLabel,
        participant,
        contentRef: content ? { setId: content.setId, version: content.version } : null,
        attemptId,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      clearSavedRun(storageKey);
      router.push(result.data.redirectTo);
    });
  }

  return (
    <>
      <Runner
        contextLabel={contextLabel}
        onSubmit={handleSubmit}
        error={error}
        initialState={initialRunnerState}
        onProgress={handleProgress}
        content={content}
        timer={clock ? { expiresAt: clock.expiresAt, serverNow: clock.serverNow } : null}
      />
      {pending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/85 backdrop-blur-sm" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p>Carregando resultados.</p>
        </div>
      )}
    </>
  );
}
