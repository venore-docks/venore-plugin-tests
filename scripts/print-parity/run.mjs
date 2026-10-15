// REGRESSÃO DE IMPRESSÃO do relatório DISC — compara o A4 gerado hoje com o PDF de referência do
// NestPro (modules/disc/report/__fixtures__/exemplo-relatorio-disc.pdf).
//
//   node scripts/print-parity/run.mjs            (a partir da pasta do plugin; core em ../venore-docks)
//
// Monta o relatório numa página de teste (casca de site falsa, modo escuro), imprime em A4 pelo Edge
// e confere: 1 página; nenhum texto da casca; e a POSIÇÃO de cada texto de referência (±1,5pt).
// Itens que mudaram de propósito depois do original (nomes completos no eixo do gráfico, legenda do
// gráfico de superfície, faixa "acima de 80") ficam fora da comparação — ver IGNORED.
//
// Pré-requisitos: core clonado e instalado em ../venore-docks e o Microsoft Edge. Instala
// pdfjs-dist no core com --no-save (não altera package.json/lock).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const plugin = path.resolve(here, "../..");
const core = path.resolve(plugin, "../venore-docks");
const slash = (value) => value.replaceAll("\\", "/");
const requireCore = createRequire(path.join(core, "package.json"));

if (!fs.existsSync(path.join(core, "node_modules"))) throw new Error(`Core não instalado em ${core}`);
if (!fs.existsSync(path.join(core, "node_modules", "pdfjs-dist"))) {
  console.log("Instalando pdfjs-dist no core (--no-save)…");
  execFileSync("npm", ["install", "--no-save", "--no-audit", "--no-fund", "--loglevel=error", "pdfjs-dist@4.10.38"], { cwd: core, stdio: "inherit", shell: true });
}

const esbuild = requireCore("esbuild");
const postcss = requireCore("postcss");
const tailwind = requireCore("@tailwindcss/postcss");
const { chromium } = requireCore("playwright");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "print-parity-"));
// O plugin não tem node_modules próprio: um junction temporário dá a ele o do core (o esbuild
// resolve react/recharts a partir da pasta do arquivo).
const junction = path.join(plugin, "node_modules");
const hadNodeModules = fs.existsSync(junction);
if (!hadNodeModules) fs.symlinkSync(path.join(core, "node_modules"), junction, "junction");

let exitCode = 0;
try {
  // 1) bundle
  await esbuild.build({
    entryPoints: [path.join(here, "entry.tsx")],
    bundle: true,
    outfile: path.join(work, "out.js"),
    format: "iife",
    jsx: "automatic",
    tsconfig: path.join(core, "tsconfig.json"),
    alias: {
      "@venore/plugin-sdk/ui": path.join(here, "sdk-ui-shim.ts"),
      "@core": path.join(core, "src"),
      react: path.join(core, "node_modules/react"),
      "react-dom": path.join(core, "node_modules/react-dom"),
    },
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "error",
  });

  // 2) CSS (Tailwind v4 com os tokens do tema nestpro — o mesmo que o site usa)
  const themeCss = path.join(path.resolve(plugin, "../venore-theme-nestpro"), "theme.css");
  const css = [
    `@import "${slash(path.join(core, "node_modules/tailwindcss/index.css"))}";`,
    `@source "${slash(plugin)}";`,
    `@import "${slash(path.join(core, "src/themes/venore-slime/theme.css"))}";`,
    fs.existsSync(themeCss) ? `@import "${slash(themeCss)}";` : "",
    `@import "${slash(path.join(core, "src/app/styles/region-tokens.css"))}";`,
    fs.readFileSync(path.join(core, "src/app/globals.css"), "utf8").split("\n").slice(55).join("\n"),
  ].join("\n");
  const compiled = await postcss([tailwind()]).process(css, { from: path.join(core, "print-parity.css") });
  fs.writeFileSync(path.join(work, "out.css"), compiled.css);
  fs.writeFileSync(
    path.join(work, "page.html"),
    '<!doctype html><html lang="pt-BR" data-theme="nestpro"><head><meta charset="utf-8"><link rel="stylesheet" href="out.css"></head><body><div id="root"></div><script src="out.js"></script></body></html>',
  );

  // 3) imprime em A4
  const server = http
    .createServer((req, res) => {
      const file = path.join(work, decodeURIComponent(req.url.split("?")[0]));
      if (!fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
      res.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html");
      res.end(fs.readFileSync(file));
    })
    .listen(0);
  const port = server.address().port;
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:${port}/page.html`);
  await page.waitForTimeout(1500);
  await page.emulateMedia({ media: "print" });
  const mine = path.join(work, "mine.pdf");
  await page.pdf({ path: mine, format: "A4", printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" }, preferCSSPageSize: true });
  await browser.close();
  server.close();

  // 4) compara o texto (posição) com a referência
  const pdfjs = await import(pathToFileURL(path.join(core, "node_modules/pdfjs-dist/legacy/build/pdf.mjs")).href);
  async function textItems(file) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)) }).promise;
    const first = await doc.getPage(1);
    const viewport = first.getViewport({ scale: 1 });
    const content = await first.getTextContent();
    return {
      pages: doc.numPages,
      items: content.items.filter((item) => item.str.trim()).map((item) => ({ text: item.str, x: item.transform[4], y: viewport.height - item.transform[5] })),
    };
  }
  const reference = await textItems(path.join(plugin, "modules/disc/report/__fixtures__/exemplo-relatorio-disc.pdf"));
  const current = await textItems(mine);

  // Mudou DE PROPÓSITO depois do original (não entra na comparação de posição).
  const IGNORED = [/^\d+%$/, /^(D|I|S|C)$/, /^Autoimagem (Externa|Interna)$/, /^Sc$|^Sdi$/, /Muito alta/, /^\d{1,2}$|^:$|^de$|^abril$|^2026$/];
  const problems = [];
  if (current.pages !== 1) problems.push(`o relatório imprimiu em ${current.pages} páginas (esperado: 1)`);
  for (const item of current.items) {
    if (/SHELL (HEADER|FOOTER)/.test(item.text)) problems.push(`texto da casca do site apareceu na impressão: "${item.text}"`);
  }
  let compared = 0;
  const TOLERANCE_PT = 1.5;
  for (const ref of reference.items) {
    if (IGNORED.some((pattern) => pattern.test(ref.text.trim()))) continue;
    const key = ref.text.slice(0, 18);
    // Texto dependente de dado (descrição do perfil) quebra linha diferente se a descrição mudar: só confere o que existe nos dois.
    const found = current.items.find((item) => item.text.slice(0, 18) === key);
    if (!found) { if (!/^(O persistente|segunda|planejador|valores|em suas)/.test(ref.text)) problems.push(`texto de referência ausente: "${ref.text.slice(0, 40)}"`); continue; }
    compared += 1;
    const dx = Math.abs(found.x - ref.x);
    const dy = Math.abs(found.y - ref.y);
    // O rodapé subiu de propósito (~9pt): na posição do legado ele ficava rente à borda do papel e
    // era cortado pela área não imprimível das impressoras. Só a vertical é relaxada.
    const isFooter = /^www.nestpro/.test(ref.text.trim());
    const dyLimit = isFooter ? 14 : TOLERANCE_PT;
    if (dx > TOLERANCE_PT || dy > dyLimit) problems.push(`"${ref.text.slice(0, 30)}" fora de posição (dx ${dx.toFixed(1)}pt, dy ${dy.toFixed(1)}pt)`);
  }
  console.log(`Páginas: ${current.pages} · textos comparados: ${compared} · tolerância ±${TOLERANCE_PT}pt`);
  if (problems.length) {
    console.error(`\n✖ Impressão difere do legado:\n  - ${problems.join("\n  - ")}`);
    console.error(`\n(PDF gerado: ${mine})`);
    exitCode = 1;
  } else {
    console.log("✓ Impressão igual ao relatório do NestPro (dentro da tolerância).");
    fs.rmSync(work, { recursive: true, force: true });
  }
} finally {
  if (!hadNodeModules) fs.rmSync(junction, { recursive: false, force: true });
}
process.exit(exitCode);
