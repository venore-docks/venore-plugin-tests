import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@venore/plugin-sdk/ui";
import type { InstanceAggregateView, QuestionAggregate } from "../../index";

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  );
}

function QuestionBlock({ question, index }: { question: QuestionAggregate; index: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {index + 1}. {question.text}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{question.answered} resposta(s)</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {question.scale && (
          <>
            {question.scale.distribution.map((count, i) => {
              const percent = question.answered ? Math.round((count / question.answered) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-muted-foreground">
                    {i + 1} · {question.scale?.labels[i]}
                  </span>
                  <Bar percent={percent} />
                  <span className="w-12 text-end tabular-nums text-muted-foreground">{count}</span>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">Média: {question.scale.mean ?? "—"} de {question.scale.points}</p>
          </>
        )}
        {question.options?.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <span className="w-48 shrink-0 truncate text-muted-foreground">{option.text}</span>
            <Bar percent={option.percent} />
            <span className="w-16 text-end tabular-nums text-muted-foreground">
              {option.count} ({option.percent}%)
            </span>
          </div>
        ))}
        {question.texts && (
          <ul className="flex list-disc flex-col gap-1 ps-5">
            {question.texts.length === 0 ? <li className="list-none text-muted-foreground">Nenhum comentário.</li> : question.texts.map((text, i) => <li key={i}>{text}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Resultado AGREGADO de uma pesquisa anônima: por pergunta, nunca por pessoa — e só com o mínimo de
// respostas (abaixo disso, deduzir quem respondeu o quê seria fácil, então nada aparece).
export function AggregateView({ aggregate }: { aggregate: InstanceAggregateView }) {
  if (aggregate.insufficient) {
    return (
      <EmptyState
        title="Ainda não há respostas suficientes"
        description={`Para proteger o anonimato, o resultado só aparece com pelo menos ${aggregate.minResponses} respostas. Já foram ${aggregate.total}.`}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{aggregate.total} respostas anônimas.</p>
      {aggregate.questions.map((question, index) => (
        <QuestionBlock key={question.id} question={question} index={index} />
      ))}
    </div>
  );
}
