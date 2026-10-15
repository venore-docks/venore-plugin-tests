# Roda o teste de integração do plugin (tests/integration) contra um Postgres EM MEMÓRIA (PGlite) —
# nenhum banco real é tocado. Usa o vitest e o drizzle-orm do core clonado em ..\venore-docks.
#
# O que faz, e desfaz ao terminar:
#   1. instala @electric-sql/pglite no core SEM gravar em package.json/lock (--no-save);
#   2. cria um junction node_modules -> core (o plugin não tem node_modules próprio);
#   3. roda o vitest; 4. remove o junction.
#
# Uso (PowerShell, a partir da pasta do plugin):  .\scripts\run-integration.ps1
$ErrorActionPreference = "Stop"
$plugin = Split-Path -Parent $PSScriptRoot
$core = Join-Path (Split-Path -Parent $plugin) "venore-docks"
if (-not (Test-Path $core)) { throw "Core não encontrado em $core" }

Push-Location $core
try {
  npm install --no-save --no-audit --no-fund --loglevel=error @electric-sql/pglite
  $junction = Join-Path $plugin "node_modules"
  if (Test-Path $junction) { throw "$junction já existe — remova antes (é só um junction temporário)." }
  New-Item -ItemType Junction -Path $junction -Target (Join-Path $core "node_modules") | Out-Null
  try {
    npx vitest run --config (Join-Path $plugin "tests\integration\vitest.integration.config.ts")
  } finally {
    (Get-Item $junction).Delete()
  }
} finally {
  Pop-Location
}
