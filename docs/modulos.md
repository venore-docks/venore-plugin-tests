# Regras para criar um módulo de teste

Um **módulo** é um teste (DISC, Big Five, Conhecimentos, Clima…) que roda dentro da plataforma do
plugin Testes. A plataforma cuida de rotas, equipes, aplicações com link, identificação, resultados,
impressão e ativação; o módulo cuida só do que é próprio do teste.

O teste automático `platform/modules/contract.test.ts` confere cada módulo registrado contra estas
regras. Módulo que descumpre **falha o CI** — não existe exceção silenciosa.

## Como adicionar

1. Criar `modules/<id>/` (id em kebab-case, único, fora dos ids reservados — ver `RESERVED_MODULE_IDS`
   em `platform/modules/contract.ts`).
2. Implementar o contrato de dados `TestModule` (`modules/<id>/index.ts`).
3. Implementar o runner (client) e a folha de relatório (servidor).
4. Entregar `modules/<id>/fixtures.ts` (formato `ModuleFixtures`).
5. Registrar em **três** lugares: `platform/modules/registry.ts`, `runner-registry.ts` e
   `report-registry.ts` — e listar as fixtures em `contract.test.ts`. Esquecer qualquer um falha o teste.
6. O módulo nasce **desligado** (`defaultEnabled: false`) e só aparece depois que um administrador o
   liga em `/admin/tests`. O DISC é o único que nasce ligado.

## As regras

1. **Uma pasta, um contrato.** O módulo declara id, nome, descrição, duração estimada, `version`,
   `source`, `contentKind`, `defaultEnabled`, texto de ajuda, `validateAnswers`, `score` e (opcional)
   `describeHeadline`.
2. **Só implementa o contrato.** Nada de rotas, tabelas, `db` ou chamadas ao core: a plataforma é a
   dona disso. O módulo recebe respostas e devolve um resultado; guardar, listar, controlar acesso e
   navegar é da plataforma. Um módulo **não importa outro módulo**; o que for comum sobe para
   `platform/`.
3. **Pontuação só no servidor, depois de validar.** `validateAnswers` confere formato **e**
   completude antes de `score` rodar. Nunca confie no navegador. Gabarito, resposta certa ou qualquer
   dado que denuncie a pontuação **nunca** vai para o navegador.
4. **Fixtures de paridade obrigatórias.** Entradas válidas com o resumo (`headline`) esperado e
   entradas inválidas que devem ser recusadas. Mudar a fórmula quebra o teste — e quem muda sobe a
   `version` (regra 5).
5. **Versão no resultado.** `version` é gravada em cada resultado. Qualquer mudança que altere um
   número que o usuário vê (pergunta, pesos, faixas) **sobe a versão**. Relatórios antigos continuam
   legíveis; o módulo sabe interpretar versões anteriores ou degrada com mensagem clara.
6. **Impressão em A4.** A folha do relatório imprime em **uma página A4 de papel branco**, sem
   depender de opção do navegador ("gráficos em segundo plano"): gráficos e fundos são elementos
   reais do DOM (SVG), tamanho **fixo** com escala por CSS (use `platform/ui/fixed-chart.tsx`; o
   `ResponsiveContainer` do recharts não remede na impressão). Tokens de cor fixos para o papel ficam
   num `<style>` no escopo da folha (como `modules/disc/report/report-print-style.tsx`). O isolamento
   do site é da plataforma (`platform/ui/print-portal.tsx`). Entregue uma comparação visual contra
   uma referência quando o relatório tiver um layout legado a preservar.
7. **Tema.** Na tela use só tokens do tema (`bg-card`, `text-muted-foreground`…). Cor do domínio
   (como D/I/S/C) vai em `var(--token, fallback)` — sem o fallback, em tema que não define a variável
   a cor some (aconteceu: barras pretas).
8. **Runner = só as perguntas.** O runner recebe `{ contextLabel, onSubmit, error }`. Enviar, "calculando",
   erro de rede, navegação e retomada de progresso são do `ModuleRunnerHost`. O runner chama
   `onSubmit(respostas)` uma única vez, no fim.
9. **Origem e licença registradas.** `source.author` e `source.license` são obrigatórios (e
   `source.reference` quando houver link/citação). **Não entra módulo cuja fórmula ou banco de
   perguntas não tenha dono e licença conhecidos.** Quem cria o módulo responde pela validade
   psicométrica e pela licença; a plataforma não inventa normas nem traduz instrumentos.
10. **Conteúdo fixo ou editável.** `contentKind: "static"` = perguntas no código (DISC). `"authored"` = o conteúdo é um **conjunto de perguntas editável** no admin (`/admin/tests` → Editar conteúdo): pergunta, respostas, **quantidade de respostas**, gabarito, escala (nº de pontos e rótulos) e configurações. Em ambos, `dataset` é JSON puro (vai para `jsonb`).

## Módulo com conteúdo editável (`authored`)

Além do contrato acima, o módulo declara `authoring` (tipos de pergunta aceitos, mínimos/máximos, campos próprios por pergunta e do conjunto, regras extras de publicação e o **conteúdo de exemplo**) e recebe o conteúdo em `validateAnswers(answers, context)` / `score(answers, context)`, onde `context.content` é a **versão publicada** usada nesta resposta.

- **Rascunho × versão publicada.** O administrador edita um rascunho e **publica** versões imutáveis. Aplicações e resultados apontam para (conjunto, versão): editar ou publicar depois nunca muda o que já foi aplicado ou respondido. Conjunto usado só é **arquivado**, nunca apagado.
- **O runner é da plataforma.** Módulos authored usam o `QuestionnaireRunner` (resposta única, múltipla, escala, texto livre; embaralhar; cronômetro; retomar). O módulo só entrega conteúdo e pontuação.
- **Gabarito não sai do servidor.** O navegador recebe `RunnerContent` (sem `correct` e sem `meta`). O teste de contrato confere.
- **Pontuação só contra a versão publicada**, nunca contra o rascunho.
- **Dataset autossuficiente.** Grave no resultado o que o relatório precisa (textos, gabarito, notas): ele deve continuar legível se o conjunto for arquivado.
- **Tempo limite** (`settings.timeLimitMinutes`): a plataforma abre uma tentativa no servidor e informa `elapsedSeconds`/`timeLimitSeconds`; o módulo decide o que fazer com envio fora do prazo.
- **Anônimo** (`defaultIdentityMode: "anonymous"`, `aggregateOnly`): sem identidade e sem lista individual; o líder vê só o agregado, e só com ≥ 5 respostas.
- **Conteúdo de exemplo** (`starterContent`) precisa passar na validação de publicação do módulo — o teste de contrato confere. Marque-o como demonstração (`settings.demo`) para o relatório avisar.

## Contexto e identificação (não são do módulo)

- O **contexto** ("no trabalho", "no time de vendas") é pedido pela plataforma antes do teste e
  chega ao runner como `contextLabel`. O módulo deve mostrá-lo no enunciado.
- A **identificação** (nome e e-mail, login) é da plataforma e da aplicação (`identityMode`). O módulo
  nunca coleta nem armazena dados pessoais — recebe só as respostas.
- O relatório recebe `TestResultView.identity` já filtrado: se a pessoa não pode ver nome/e-mail,
  `identity` vem `null`. A folha mostra o que vier.

## Desativar não apaga

Um módulo desligado some do catálogo e impede novas aplicações e respostas, mas **resultados já
gravados continuam acessíveis** — por isso o relatório do módulo precisa continuar renderizável
mesmo desligado. Nunca remova um módulo do registro enquanto houver resultados dele no banco.
