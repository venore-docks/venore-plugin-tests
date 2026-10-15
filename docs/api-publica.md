# API pública do plugin Testes (v1) e regras para quem a consome

O único ponto de entrada para outro plugin (ex.: **vagas**) é o barrel do pacote
(`@venore/plugin-tests`, `index.ts`), carregado com `importActivePluginBarrel("tests")`.
`TESTS_API_VERSION` informa a versão.

## Regras de consumo

1. **Só pela porta pública**, com a dependência declarada em `manifest.dependencies` do consumidor
   (`{ pluginKey: "tests", type: "optional" }` quando o consumidor funciona sem o Testes). Nunca
   importar arquivo interno do plugin.
2. **Consumir, não copiar.** Mostre resultados com o componente embutível
   (`TestResultReport`, exportado pelo barrel — com dependência opcional use `barrel.TestResultReport`; também em `@venore/plugin-tests/report-view` — passando `footerText={await getTestReportFooterText()}` para usar o rodapé configurado no admin), que já traz a folha do módulo, a
   impressão em A4 e o isolamento do site. **Não duplique gráficos, relatório nem impressão.**
3. **O consumidor não altera** o plugin nem os resultados: só cria aplicações e lê resultados.
4. **A autorização é do consumidor.** As funções `*External` ignoram sessão e papel de equipe — quem
   chama já checou a própria permissão de negócio (ex.: `vagas.applications.review`) **antes**.
   Nunca exponha uma função `*External` a uma rota ou ação sem essa checagem.
5. **Idempotência.** `createTestInstanceExternal` com a mesma `externalRef` (ex.:
   `vagas:<candidaturaId>`) devolve a aplicação que já existe, sem duplicar.
6. **Dados pessoais.** O candidato informa nome e e-mail na própria tela do teste (aplicação
   `identified`). O consumidor não repassa nem armazena a identidade por conta própria; lê o que
   precisar do resultado (`TestResultView.identity`).
7. **Compatibilidade.** Mudança incompatível na API sobe a **versão maior** de `TESTS_API_VERSION` e
   vem com aviso aos consumidores. `createDiscInstanceExternal`, `listInstanceReportsExternal` e
   `getDiscReport` (em `compat/disc.ts`) são legado do antigo plugin DISC: o vagas já usa a API
   genérica, então só ficam para versões antigas do vagas; não ganham recursos novos.

## Funções (v1)

| Função | Quem usa | Gate |
|---|---|---|
| `listActiveTestModules()` / `listAllTestModules()` | catálogo / admin | público / `tests.modules.manage` |
| `setTestModuleEnabled({ moduleId, enabled })` | admin | `tests.modules.manage` |
| `createTestInstance(input)` | UI de equipe | login + admin da equipe |
| `createTestInstanceExternal(command)` | plugin consumidor | **nenhum — autorização do consumidor** |
| `getTestInstanceBySlug({ slug })` | convite | público |
| `submitTestAttempt(input)` | tela do teste | pelo `identityMode` da aplicação |
| `getTestResult({ resultId, capabilityResultIds })` | página de resultado | dono, equipe da aplicação ou cookie de acesso temporário |
| `getTestResultExternal(resultId)` | plugin consumidor | **nenhum — autorização do consumidor** |
| `listTestInstanceResults({ instanceId })` | líder da equipe | membro da equipe |
| `listTestInstanceResultsExternal(instanceId)` | plugin consumidor | **nenhum — autorização do consumidor** |
| `reopenTestResult({ resultId })` | líder da equipe | admin da equipe |
| `listTestQuestionSets` / `getTestQuestionSet` / `createTestQuestionSet` / `saveTestQuestionSetDraft` / `publishTestQuestionSet` / `setDefaultTestQuestionSet` / `duplicateTestQuestionSet` / `deleteTestQuestionSet` / `createStarterTestQuestionSet` | admin (editor de conteúdo) | `tests.content.manage` |
| `getTestRunContent({ moduleId, instanceId })` | tela do teste | público (conteúdo SEM gabarito) |
| `startTestAttempt(input)` | tela do teste | pelo `identityMode`; abre a tentativa com tempo limite |
| `getTestInstanceAggregate({ instanceId })` | líder da equipe | membro da equipe (pesquisa anônima: só com ≥ 5 respostas) |
| `getTestInstanceAggregateExternal(instanceId)` | plugin consumidor | **nenhum — autorização do consumidor** |
| `claimTestResult({ resultId })` | pós-login (avulso) | login |
| `listMyTestResults()` | meus resultados | login |
| `createTestTeam` / `getTestTeam` / `listMyTestTeams` / `listTeamTestInstances` | equipes | login + papel |

## Quem vê um resultado

- o **dono** (conta que respondeu ou reivindicou);
- **membros da equipe** da aplicação;
- o navegador de quem respondeu **sem login** uma aplicação que mostra o resultado, por 6 horas
  (cookie httpOnly) — só para ver na hora e salvar o PDF;
- o consumidor, via `getTestResultExternal`, depois de autorizar.

O link do resultado **sozinho nunca** dá acesso. Resposta avulsa (sem aplicação) só é exibida depois
do login, que a vincula à conta; as que ninguém reivindica são apagadas em 30 dias.

## Modos de identificação de uma aplicação (`identityMode`)

- `identified` — responde **sem login**, informando nome e e-mail. Uma resposta por e-mail por
  aplicação (chave: e-mail normalizado). Equipe e vaga usam este modo.
- `login` — exige conta (também limita a uma resposta por conta).
- `anonymous` — não coleta identidade (pesquisa de clima; só resultado agregado).

`showResultToParticipant` decide se quem respondeu sem login vê o próprio resultado ao final
(equipe: sim; vaga: não, o RH vê).

## Rotas

Públicas em `/testes/...`. As URLs antigas `/disc/...` continuam funcionando como **apelidos
permanentes** (links já distribuídos; o vagas ainda manda o candidato para `/disc/teste`). Não remover
sem conferir que nenhum link antigo está em uso.
