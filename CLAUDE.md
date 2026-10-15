# @venore/plugin-tests — instruções para o Claude

Plugin do [Venore Docks](https://github.com/venore-docks/venore-docks), instalado no core como dependência git
(`@venore/plugin-tests`). Plataforma de **testes em módulos** (DISC, Big Five, Conhecimentos, Clima…): equipes,
aplicações com link, identificação, resultados, impressão e ativação. Sucessor do `@venore/plugin-disc` / NestPro.
Este repo não roda sozinho: build, lint, typecheck e testes rodam **a partir do core**.

## Onde está o quê

- `platform/` — o que é comum a todo teste: contrato e registro de módulos (`modules/`), ativação, acesso por equipe,
  telas de execução (`run/`), relatório embutível (`report/`), impressão isolada (`ui/`).
- `modules/<id>/` — um teste. **Regras para criar/alterar módulos: `docs/modulos.md`** (leia antes de mexer num módulo).
- `features/` — casos de uso `handler → service → store` (AGENTS.md §1 do core).
- `routes/` — páginas e ações; toda rota mora em `routes/route-table.ts`, nunca em `app/`.
- `compat/` — funções do antigo `plugin-disc` que o **vagas** ainda consome. Não crescem.
- **API pública e regras de quem consome o plugin: `docs/api-publica.md`.**

## Regras de arquitetura

As regras são as do core — não copie para cá, leia lá quando a tarefa tocar a área:
- `AGENTS.md` do core (§1 camadas `handler → service → store`, `OperationResult<T>`; §2 padrões proibidos).
  Todo "AGENTS.md §N" citado em comentário deste repo se refere ao **AGENTS.md do core**.
- `.claude/rules/plugin-routes.md` do core: toda rota mora em `routes/route-table.ts`, nunca em `app/`.
- `.claude/rules/css-tokens.md` do core: só tokens shadcn (`bg-card`, `text-muted-foreground`…), sem cor crua.
  Exceção documentada: o relatório DISC reproduz o layout legado do NestPro (cores fixas na folha impressa).
- Contexts do core só via barrel (`@/contexts/<nome>`) ou `contracts/`; outro plugin só via barrel, com a
  dependência declarada no `manifest.ts`.
- Schema: migration gerada com `drizzle-kit generate` (`drizzle.config.ts`), nunca editar `_journal.json` à mão.

## Verificar contra o core

Com o core clonado em `../venore-docks`:

```bash
cd ../venore-docks
npm pkg set "dependencies.@venore/plugin-tests=file:../venore-plugin-tests"   # não commitar
npm install --no-audit --no-fund --loglevel=error
npm run gen:registries:strict && npm run typecheck
npm run test:plugins -- venore-plugin-tests --reporter=dot   # roda ../venore-plugin-tests/**/*.test.ts
git checkout package.json package-lock.json                                    # desfaz o file:
```

Verificações extras (rodam a partir do plugin; usam o core em `../venore-docks`, sem tocar em banco real):

```bash
pwsh scripts/run-integration.ps1          # serviços contra um Postgres EM MEMÓRIA (PGlite): migration, acesso, bloqueio por e-mail…
node scripts/print-parity/run.mjs         # impressão A4 do relatório DISC × PDF do NestPro (±1,5pt) — exige o Edge instalado
```

Neste setup o npm **copia** o plugin para `node_modules/@venore/plugin-tests` (não cria link): edição no plugin só
chega ao dev depois de ressincronizar (dev parado: `rm -rf node_modules/@venore/plugin-tests && npm install`).

## Versão

`package.json` `version` = `manifest.ts` `version` = tag `vX.Y.Z`. Publicar = subir a versão nos dois e criar a tag
`v<version>` no mesmo commit (`git tag vX.Y.Z && git push origin vX.Y.Z`).
O core passa a usar a versão nova com a skill `bump-plugin` do core — nunca ajuste o core para acomodar o pacote.

## Economia de tokens

- Uma sessão por tarefa; o que precisa sobreviver vai para a passagem de sessão (skill `passagem-de-sessao` do core).
- Anexe à sessão só os repos que vão mudar; para consultar o core, leia o arquivo pontual em vez de clonar tudo.
- Saída enxuta: `--reporter=dot`, `git diff --stat` antes do diff, arquivo grande por faixa.
