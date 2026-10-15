"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Copy, Plus, Star, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
  Textarea,
  cn,
} from "@venore/plugin-sdk/ui";
import { validateContent } from "../../platform/content/validate-content";
import type { AuthoringSpec, FieldDef, FieldValue, Question, QuestionKind, QuestionOption, QuestionSetContent } from "../../platform/content/types";
import { deleteAction, duplicateAction, publishAction, saveDraftAction, setDefaultAction } from "./actions";

// Só a parte serializável do AuthoringSpec (as funções ficam no servidor).
export type AuthoringSpecView = Pick<
  AuthoringSpec,
  "allowedKinds" | "optionsHaveCorrect" | "minQuestions" | "maxQuestions" | "minOptions" | "maxOptions" | "scalePoints" | "questionFields" | "setFields"
>;

export type EditorInitial = {
  setId: string;
  moduleId: string;
  moduleName: string;
  title: string;
  description: string;
  draft: QuestionSetContent;
  publishedVersion: number | null;
  hasUnpublishedChanges: boolean;
  isDefault: boolean;
  archived: boolean;
  instanceCount: number;
  resultCount: number;
  versions: Array<{ version: number; title: string; publishedAt: string }>;
  publishProblems: string[];
};

const KIND_LABEL: Record<QuestionKind, string> = {
  single: "Resposta única",
  multiple: "Várias respostas",
  scale: "Escala de concordância",
  text: "Texto livre",
};

function newId(prefix: string): string {
  return `${prefix}${crypto.randomUUID().slice(0, 8)}`;
}

function defaultMeta(fields: FieldDef[]): Record<string, FieldValue> | undefined {
  const meta: Record<string, FieldValue> = {};
  for (const field of fields) if (field.defaultValue !== undefined) meta[field.key] = field.defaultValue;
  return Object.keys(meta).length ? meta : undefined;
}

function newQuestion(kind: QuestionKind, spec: AuthoringSpecView): Question {
  const question: Question = { id: newId("q"), text: "", kind, required: kind !== "text", meta: defaultMeta(spec.questionFields) };
  if (kind === "single" || kind === "multiple") {
    question.options = Array.from({ length: Math.max(2, spec.minOptions) }, () => ({ id: newId("o"), text: "" }));
  }
  return question;
}

function FieldInput({ field, value, onChange, id }: { field: FieldDef; value: FieldValue | undefined; onChange: (value: FieldValue | undefined) => void; id: string }) {
  const label = (
    <label htmlFor={id} className="text-xs text-muted-foreground">
      {field.label}
      {field.required && " *"}
    </label>
  );
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm" htmlFor={id}>
        <input id={id} type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
        {field.label}
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-1">
        {label}
        <select id={id} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value || undefined)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Escolha…</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div className="space-y-1">
        {label}
        <Input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          value={typeof value === "number" ? value : ""}
          onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {label}
      <Input id={id} value={typeof value === "string" ? value : ""} maxLength={200} onChange={(event) => onChange(event.target.value || undefined)} />
    </div>
  );
}

export function SetEditor({ initial, spec }: { initial: EditorInitial; spec: AuthoringSpecView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [content, setContent] = useState<QuestionSetContent>(initial.draft);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [serverProblems, setServerProblems] = useState<string[]>(initial.publishProblems);
  const [unpublished, setUnpublished] = useState(initial.hasUnpublishedChanges);
  const readOnly = initial.archived;

  // Problemas que impedem publicar, calculados no navegador com as regras GENÉRICAS (feedback na hora);
  // as regras próprias do módulo chegam do servidor ao salvar.
  const localProblems = useMemo(() => validateContent(content, { ...spec, starterContent: () => content }, "publish").map((error) => error.message), [content, spec]);
  const problems = dirty ? localProblems : [...new Set([...localProblems, ...serverProblems])];

  function edit(update: (current: QuestionSetContent) => QuestionSetContent) {
    setContent((current) => update(current));
    setDirty(true);
    setMessage(null);
  }
  function editQuestion(index: number, update: (question: Question) => Question) {
    edit((current) => ({ ...current, questions: current.questions.map((question, i) => (i === index ? update(question) : question)) }));
  }
  function move(index: number, delta: number) {
    edit((current) => {
      const questions = [...current.questions];
      const target = index + delta;
      if (target < 0 || target >= questions.length) return current;
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...current, questions };
    });
  }
  function setScalePoints(points: number) {
    edit((current) => {
      const labels = Array.from({ length: points }, (_, i) => current.scale?.labels[i] ?? "");
      return { ...current, scale: { points, labels } };
    });
  }

  function save(afterSave?: () => void) {
    startTransition(async () => {
      const result = await saveDraftAction(initial.moduleId, initial.setId, { title, description, content });
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setDirty(false);
      setServerProblems(result.publishProblems ?? []);
      setUnpublished(result.hasUnpublishedChanges ?? true);
      setMessage({ kind: "ok", text: "Rascunho salvo." });
      afterSave?.();
    });
  }

  function publish() {
    startTransition(async () => {
      const saved = await saveDraftAction(initial.moduleId, initial.setId, { title, description, content });
      if (saved.error) return setMessage({ kind: "error", text: saved.error });
      const result = await publishAction(initial.moduleId, initial.setId);
      if (result.error) {
        setServerProblems(saved.publishProblems ?? []);
        return setMessage({ kind: "error", text: result.error });
      }
      setDirty(false);
      setUnpublished(false);
      setServerProblems([]);
      setMessage({ kind: "ok", text: `Versão ${result.version} publicada. Aplicações que já existem continuam na versão anterior; as novas usam esta.` });
      router.refresh();
    });
  }

  function run(action: () => Promise<{ error: string | null }>, ok: string, then?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.error) return setMessage({ kind: "error", text: result.error });
      setMessage({ kind: "ok", text: ok });
      then?.();
      router.refresh();
    });
  }

  const usesScale = spec.allowedKinds.includes("scale");
  const canAddQuestion = content.questions.length < spec.maxQuestions && !readOnly;

  return (
    <div className="flex flex-col gap-6">
      {readOnly && <p className="rounded-panel border border-warning-border bg-warning-soft p-3 text-sm">Este conjunto está arquivado: dá para consultar, não para editar.</p>}

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => save()} disabled={pending || readOnly || !dirty}>
          Salvar rascunho
        </Button>
        <Button type="button" variant="default" onClick={publish} disabled={pending || readOnly || problems.length > 0 || (!dirty && !unpublished)}>
          Publicar nova versão
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pending || readOnly || dirty || initial.publishedVersion === null || initial.isDefault}
          onClick={() => run(() => setDefaultAction(initial.moduleId, initial.setId), "Definido como o conjunto padrão deste teste.")}
        >
          <Star className="h-4 w-4" /> {initial.isDefault ? "É o padrão" : "Tornar padrão"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await duplicateAction(initial.moduleId, initial.setId);
              if (result.error) return setMessage({ kind: "error", text: result.error });
              router.push(`/admin/tests/conteudo/${initial.moduleId}/${result.setId}`);
            })
          }
        >
          <Copy className="h-4 w-4" /> Duplicar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" className="gap-2 text-destructive" disabled={pending || readOnly}>
              <Trash2 className="h-4 w-4" /> {initial.instanceCount + initial.resultCount > 0 ? "Arquivar" : "Excluir"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{initial.instanceCount + initial.resultCount > 0 ? "Arquivar este conjunto?" : "Excluir este conjunto?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {initial.instanceCount + initial.resultCount > 0
                  ? `Há ${initial.instanceCount} aplicação(ões) e ${initial.resultCount} resposta(s) que usam este conjunto. Ele será arquivado: some das listas e não pode mais ser escolhido, mas os resultados continuam legíveis.`
                  : "Ninguém usou este conjunto. Ele será apagado de vez, com todas as versões publicadas."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteAction(initial.moduleId, initial.setId);
                    if (result.error) return setMessage({ kind: "error", text: result.error });
                    router.push(`/admin/tests/conteudo/${initial.moduleId}`);
                  })
                }
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <span className="ms-auto text-xs text-muted-foreground">
          {initial.publishedVersion === null ? "Nunca publicado" : `Versão publicada: ${initial.publishedVersion}`}
          {(dirty || unpublished) && initial.publishedVersion !== null ? " · há alterações não publicadas" : ""}
        </span>
      </div>

      {message && (
        <p className={cn("rounded-panel border p-3 text-sm", message.kind === "ok" ? "border-success-border bg-success-soft" : "border-destructive/40 text-destructive")} role="status">
          {message.text}
        </p>
      )}

      {problems.length > 0 && !readOnly && (
        <details className="rounded-panel border border-warning-border bg-warning-soft p-3 text-sm" open={initial.publishedVersion === null}>
          <summary className="cursor-pointer font-medium">Para poder publicar ({problems.length})</summary>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            {problems.slice(0, 12).map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
            {problems.length > 12 && <li>… e mais {problems.length - 12}.</li>}
          </ul>
        </details>
      )}

      {/* Título e configurações */}
      <section className="grid gap-4 rounded-panel border border-border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="set-title" className="text-xs text-muted-foreground">
            Título do conjunto *
          </label>
          <Input
            id="set-title"
            value={title}
            maxLength={120}
            disabled={readOnly}
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="set-description" className="text-xs text-muted-foreground">
            Descrição (opcional)
          </label>
          <Textarea
            id="set-description"
            rows={2}
            value={description}
            maxLength={500}
            disabled={readOnly}
            onChange={(event) => {
              setDescription(event.target.value);
              setDirty(true);
            }}
          />
        </div>
        {spec.setFields.map((field) => (
          <FieldInput
            key={field.key}
            id={`set-field-${field.key}`}
            field={field}
            value={content.settings[field.key]}
            onChange={(value) =>
              edit((current) => {
                const settings = { ...current.settings };
                if (value === undefined) delete settings[field.key];
                else settings[field.key] = value;
                return { ...current, settings };
              })
            }
          />
        ))}
      </section>

      {/* Escala (quantidade de pontos e rótulos) */}
      {usesScale && (
        <section className="flex flex-col gap-3 rounded-panel border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">Escala de respostas</h2>
            <p className="text-xs text-muted-foreground">Vale para as perguntas do tipo escala. Escolha quantos pontos a escala tem e o rótulo de cada ponto.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="scale-points" className="text-xs text-muted-foreground">
                Quantidade de pontos
              </label>
              <select
                id="scale-points"
                value={content.scale?.points ?? ""}
                disabled={readOnly}
                onChange={(event) => setScalePoints(Number(event.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {!content.scale && <option value="">Escolha…</option>}
                {Array.from({ length: (spec.scalePoints?.max ?? 7) - (spec.scalePoints?.min ?? 3) + 1 }, (_, i) => (spec.scalePoints?.min ?? 3) + i).map((points) => (
                  <option key={points} value={points}>
                    {points} pontos
                  </option>
                ))}
              </select>
            </div>
          </div>
          {content.scale && (
            <div className="grid gap-2 sm:grid-cols-2">
              {content.scale.labels.map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs text-muted-foreground">{index + 1}</span>
                  <Input
                    value={label}
                    maxLength={80}
                    disabled={readOnly}
                    placeholder={`Rótulo do ponto ${index + 1}`}
                    onChange={(event) => edit((current) => (current.scale ? { ...current, scale: { ...current.scale, labels: current.scale.labels.map((existing, i) => (i === index ? event.target.value : existing)) } } : current))}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Perguntas */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold">Perguntas ({content.questions.length})</h2>
            <p className="text-xs text-muted-foreground">
              De {spec.minQuestions} a {spec.maxQuestions} perguntas.
            </p>
          </div>
        </div>

        {content.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            index={index}
            total={content.questions.length}
            question={question}
            spec={spec}
            readOnly={readOnly}
            onChange={(update) => editQuestion(index, update)}
            onMove={(delta) => move(index, delta)}
            onRemove={() => edit((current) => ({ ...current, questions: current.questions.filter((_, i) => i !== index) }))}
          />
        ))}

        {canAddQuestion && (
          <div className="flex flex-wrap gap-2">
            {spec.allowedKinds.map((kind) => (
              <Button key={kind} type="button" variant="outline" size="sm" className="gap-1" onClick={() => edit((current) => ({ ...current, questions: [...current.questions, newQuestion(kind, spec)] }))}>
                <Plus className="h-4 w-4" /> {KIND_LABEL[kind]}
              </Button>
            ))}
          </div>
        )}
      </section>

      {initial.versions.length > 0 && (
        <section className="rounded-panel border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Versões publicadas</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {initial.versions.map((version) => (
              <li key={version.version}>
                v{version.version} · {version.title} · {new Date(version.publishedAt).toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {initial.instanceCount} aplicação(ões) e {initial.resultCount} resposta(s) usam este conjunto. Cada aplicação fica na versão que existia quando foi criada.
          </p>
        </section>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  total,
  question,
  spec,
  readOnly,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  question: Question;
  spec: AuthoringSpecView;
  readOnly: boolean;
  onChange: (update: (question: Question) => Question) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const options = question.options ?? [];
  const hasOptions = question.kind === "single" || question.kind === "multiple";

  function setKind(kind: QuestionKind) {
    onChange((current) => {
      const next: Question = { ...current, kind };
      if (kind === "single" || kind === "multiple") {
        next.options = current.options?.length ? current.options : newQuestion(kind, spec).options;
        // De várias para única: só uma resposta pode continuar correta.
        if (kind === "single" && spec.optionsHaveCorrect) {
          let seen = false;
          next.options = next.options?.map((option) => {
            if (option.correct && !seen) {
              seen = true;
              return option;
            }
            return { ...option, correct: undefined };
          });
        }
      } else {
        delete next.options;
      }
      return next;
    });
  }

  function setOption(optionIndex: number, update: (option: QuestionOption) => QuestionOption) {
    onChange((current) => ({ ...current, options: (current.options ?? []).map((option, i) => (i === optionIndex ? update(option) : option)) }));
  }

  function toggleCorrect(optionIndex: number) {
    onChange((current) => ({
      ...current,
      options: (current.options ?? []).map((option, i) => {
        if (current.kind === "single") return { ...option, correct: i === optionIndex ? true : undefined };
        return i === optionIndex ? { ...option, correct: option.correct ? undefined : true } : option;
      }),
    }));
  }

  return (
    <article className="flex flex-col gap-3 rounded-panel border border-border bg-card p-4">
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Pergunta {index + 1}</span>
        {spec.allowedKinds.length > 1 ? (
          <select
            aria-label={`Tipo da pergunta ${index + 1}`}
            value={question.kind}
            disabled={readOnly}
            onChange={(event) => setKind(event.target.value as QuestionKind)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            {spec.allowedKinds.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-muted-foreground">{KIND_LABEL[question.kind]}</span>
        )}
        <label className="ms-2 flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={question.required} disabled={readOnly} onChange={(event) => onChange((current) => ({ ...current, required: event.target.checked }))} className="h-3.5 w-3.5" />
          Obrigatória
        </label>
        <div className="ms-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" aria-label="Subir pergunta" disabled={readOnly || index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" aria-label="Descer pergunta" disabled={readOnly || index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" aria-label="Remover pergunta" className="text-destructive" disabled={readOnly} onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Textarea
        aria-label={`Enunciado da pergunta ${index + 1}`}
        rows={2}
        value={question.text}
        maxLength={600}
        disabled={readOnly}
        placeholder="Escreva o enunciado"
        onChange={(event) => onChange((current) => ({ ...current, text: event.target.value }))}
      />

      {hasOptions && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Respostas ({options.length}) — de {spec.minOptions} a {spec.maxOptions}.
            {spec.optionsHaveCorrect && (question.kind === "single" ? " Marque a correta." : " Marque todas as corretas.")}
          </p>
          {options.map((option, optionIndex) => (
            <div key={option.id} className="flex items-center gap-2">
              {spec.optionsHaveCorrect && (
                <input
                  type={question.kind === "single" ? "radio" : "checkbox"}
                  name={`correct-${question.id}`}
                  aria-label={`Resposta ${optionIndex + 1} é correta`}
                  checked={option.correct === true}
                  disabled={readOnly}
                  onChange={() => toggleCorrect(optionIndex)}
                  className="h-4 w-4 shrink-0"
                />
              )}
              <Input
                value={option.text}
                maxLength={300}
                disabled={readOnly}
                placeholder={`Resposta ${optionIndex + 1}`}
                onChange={(event) => setOption(optionIndex, (current) => ({ ...current, text: event.target.value }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remover resposta ${optionIndex + 1}`}
                disabled={readOnly || options.length <= 1}
                onClick={() => onChange((current) => ({ ...current, options: (current.options ?? []).filter((_, i) => i !== optionIndex) }))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {options.length < spec.maxOptions && !readOnly && (
            <div>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => onChange((current) => ({ ...current, options: [...(current.options ?? []), { id: newId("o"), text: "" }] }))}>
                <Plus className="h-4 w-4" /> Adicionar resposta
              </Button>
            </div>
          )}
        </div>
      )}

      {question.kind === "scale" && <p className="text-xs text-muted-foreground">Usa a escala de respostas do conjunto (quantidade de pontos e rótulos acima).</p>}
      {question.kind === "text" && <p className="text-xs text-muted-foreground">A pessoa escreve a resposta com as próprias palavras.</p>}

      {spec.questionFields.length > 0 && (
        <div className={cn("grid gap-3 border-t border-border pt-3", spec.questionFields.length > 1 && "sm:grid-cols-2")}>
          {spec.questionFields.map((field): ReactNode => (
            <FieldInput
              key={field.key}
              id={`q-${question.id}-${field.key}`}
              field={field}
              value={question.meta?.[field.key]}
              onChange={(value) =>
                onChange((current) => {
                  const meta = { ...current.meta };
                  if (value === undefined) delete meta[field.key];
                  else meta[field.key] = value;
                  return { ...current, meta: Object.keys(meta).length ? meta : undefined };
                })
              }
            />
          ))}
        </div>
      )}
    </article>
  );
}
