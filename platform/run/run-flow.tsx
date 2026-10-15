"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from "@venore/plugin-sdk/ui";
import { CONTEXT_EXPLANATION, CONTEXT_SUGGESTIONS, LGPD_IDENTITY_NOTICE, LGPD_LOGIN_NOTICE } from "../copy";
import type { RunnerContent } from "../content/types";
import { ModuleRunnerHost, type RunnerParticipant } from "./module-runner-host";
import { clearSavedRun, readSavedRun, savedRunKey, type SavedRun } from "./saved-run";
import type { IdentityMode } from "../../contracts/types";

export type RunFlowInstance = {
  id: string;
  title: string | null;
  contextLabel: string;
  identityMode: IdentityMode;
  teamName: string | null;
};

export type RunFlowViewer = { loggedIn: boolean; name: string | null; email: string | null };

// Tudo que vem ANTES da primeira pergunta, em uma tela só: o contexto (em destaque — é a decisão que
// mais pesa na qualidade da resposta), a identificação (nome e e-mail, só nas aplicações sem login)
// e o aviso de LGPD. Depois entrega o teste ao ModuleRunnerHost.
export function RunFlow({
  moduleId,
  moduleName,
  estimatedMinutes,
  helpTitle,
  helpHtml,
  content,
  instance,
  viewer,
  signInHref,
}: {
  moduleId: string;
  moduleName: string;
  estimatedMinutes: number;
  // "Como funciona" do módulo, mostrado antes da primeira pergunta.
  helpTitle: string;
  helpHtml: string;
  // Módulos authored: as perguntas publicadas (sem gabarito). Nulo no DISC.
  content: RunnerContent | null;
  instance: RunFlowInstance | null;
  viewer: RunFlowViewer;
  signInHref: string;
}) {
  const [started, setStarted] = useState(false);
  const [contextInput, setContextInput] = useState(instance?.contextLabel ?? "");
  const [name, setName] = useState(viewer.name ?? "");
  const [email, setEmail] = useState(viewer.email ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  // Teste em andamento guardado no navegador (sessionStorage) — só dá para ler depois de montar.
  const storageKey = savedRunKey(moduleId, instance?.id ?? null);
  const [saved, setSaved] = useState<SavedRun | null>(null);
  const [resumeState, setResumeState] = useState<unknown>(undefined);
  const [resumeAttemptId, setResumeAttemptId] = useState<string | null>(null);
  useEffect(() => {
    setSaved(readSavedRun(storageKey));
  }, [storageKey]);

  const needsIdentity = instance?.identityMode === "identified";
  const contextLabel = instance ? instance.contextLabel : contextInput.trim().replace(/\s+/g, " ");

  function handleResume() {
    if (!saved) return;
    setContextInput(saved.contextLabel);
    if (saved.participant) {
      setName(saved.participant.name);
      setEmail(saved.participant.email);
    }
    setResumeState(saved.runnerState);
    setResumeAttemptId(saved.attemptId ?? null);
    setStarted(true);
  }

  function handleRestart() {
    clearSavedRun(storageKey);
    setSaved(null);
  }

  function handleStart(event: FormEvent) {
    event.preventDefault();
    if (!instance && (contextLabel.length < 2 || contextLabel.length > 120)) {
      setFormError("Descreva em poucas palavras o contexto em que você vai responder.");
      return;
    }
    if (needsIdentity) {
      if (name.trim().length < 2) {
        setFormError("Informe seu nome.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setFormError("Informe um e-mail válido.");
        return;
      }
    }
    setFormError(null);
    setStarted(true);
  }

  if (started) {
    const participant: RunnerParticipant | null = needsIdentity ? { name: name.trim(), email: email.trim() } : null;
    return <ModuleRunnerHost moduleId={moduleId} instanceId={instance?.id ?? null} contextLabel={contextLabel} participant={participant} content={content} initialRunnerState={resumeState} initialAttemptId={resumeAttemptId} />;
  }

  return (
    <form onSubmit={handleStart} className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{moduleName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Antes de começar</h1>
        <p className="text-sm text-muted-foreground">
          Leva cerca de {estimatedMinutes} minutos. Não há resposta certa ou errada — responda com sinceridade.
          {instance?.teamName && <> Aplicação da equipe <span className="font-medium text-foreground">{instance.teamName}</span>{instance.title ? ` — ${instance.title}` : ""}.</>}
        </p>
      </div>

      {saved && (
        <Card className="border-primary">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm">
              Você tem um teste em andamento (salvo às {new Date(saved.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}). Quer continuar de onde parou?
            </p>
            <div className="flex gap-2">
              <Button type="button" onClick={handleResume}>
                Continuar
              </Button>
              <Button type="button" variant="outline" onClick={handleRestart}>
                Recomeçar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" aria-hidden />
            {instance ? "Contexto desta aplicação" : "Em que contexto você vai responder?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{CONTEXT_EXPLANATION}</p>
          {instance ? (
            <p className="rounded-panel border border-border bg-muted/40 px-4 py-3 text-base font-medium">
              {instance.contextLabel}
              <span className="mt-1 block text-xs font-normal text-muted-foreground">Definido por quem aplicou o teste — responda pensando nisso.</span>
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    size="sm"
                    variant={contextInput === suggestion ? "default" : "outline"}
                    onClick={() => setContextInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="tests-context">
                  Ou descreva com suas palavras
                </label>
                <Input
                  id="tests-context"
                  value={contextInput}
                  onChange={(event) => setContextInput(event.target.value)}
                  placeholder="Ex.: no time de vendas"
                  maxLength={120}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {needsIdentity && (
        <Card>
          <CardHeader>
            <CardTitle>Quem está respondendo?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="tests-name">
                  Nome
                </label>
                <Input id="tests-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="tests-email">
                  E-mail
                </label>
                <Input id="tests-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{LGPD_IDENTITY_NOTICE}</p>
          </CardContent>
        </Card>
      )}

      {!instance && (
        <p className="text-xs text-muted-foreground">
          {viewer.loggedIn ? (
            <>Você está logado: o resultado será salvo na sua conta.</>
          ) : (
            <>
              No final você entra com a sua conta para ver o resultado. {LGPD_LOGIN_NOTICE}{" "}
              <a href={signInHref} className="font-medium text-foreground underline underline-offset-2">
                Entrar agora
              </a>
            </>
          )}
        </p>
      )}

      <details className="rounded-panel border border-border bg-card px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">{helpTitle}</summary>
        <div className="mt-3 space-y-3 text-muted-foreground [&_span]:font-medium [&_span]:text-foreground" dangerouslySetInnerHTML={{ __html: helpHtml }} />
      </details>

      {formError && <p className={cn("text-sm text-destructive")}>{formError}</p>}

      <div>
        <Button type="submit" size="lg">
          Começar o teste
        </Button>
      </div>
    </form>
  );
}
