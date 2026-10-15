import { describe, expect, it } from "vitest";
import { bigFiveFixtures } from "../../modules/bigfive/fixtures";
import { climateFixtures } from "../../modules/clima/fixtures";
import { knowledgeFixtures } from "../../modules/conhecimentos/fixtures";
import { discFixtures } from "../../modules/disc/fixtures";
import { toRunnerContent } from "../content/runner-content";
import { validateContent } from "../content/validate-content";
import type { QuestionSetContent } from "../content/types";
import { isValidModuleId, RESERVED_MODULE_IDS } from "./contract";
import type { ModuleFixtures } from "./fixtures";
import { listReportIds } from "./report-registry";
import { listModules } from "./registry";
import { listRunnerIds } from "./runner-registry";

// TESTE DE CONTRATO — roda contra TODO módulo registrado e reprova quem descumpre docs/modulos.md.
// Para adicionar um módulo: registrá-lo em registry.ts, runner-registry.ts, report-registry.ts e
// listar as fixtures dele abaixo. Esquecer qualquer um desses falha aqui, de propósito.
const FIXTURES: Record<string, ModuleFixtures> = {
  disc: discFixtures,
  "big-five": bigFiveFixtures,
  conhecimentos: knowledgeFixtures,
  clima: climateFixtures,
};

const SEMVER = /^\d+\.\d+\.\d+$/;

describe("registro de módulos", () => {
  const modules = listModules();

  it("tem ao menos um módulo e ids únicos", () => {
    expect(modules.length).toBeGreaterThan(0);
    const ids = modules.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo id de registry tem runner, relatório e fixtures (e nada sobra)", () => {
    const ids = modules.map((module) => module.id).sort();
    expect(listRunnerIds().sort()).toEqual(ids);
    expect(listReportIds().sort()).toEqual(ids);
    expect(Object.keys(FIXTURES).sort()).toEqual(ids);
  });

  it("ids reservados da plataforma nunca viram módulo", () => {
    for (const reserved of RESERVED_MODULE_IDS) {
      expect(isValidModuleId(reserved)).toBe(false);
    }
    expect(isValidModuleId("Big Five")).toBe(false);
    expect(isValidModuleId("big-five")).toBe(true);
  });
});

describe.each(listModules().map((module) => [module.id, module] as const))("módulo %s", (_id, module) => {
  it("declara metadados obrigatórios (regra 1 e 9: origem e licença)", () => {
    expect(isValidModuleId(module.id)).toBe(true);
    expect(module.name.trim()).not.toBe("");
    expect(module.description.trim()).not.toBe("");
    expect(module.estimatedMinutes).toBeGreaterThan(0);
    expect(module.version).toMatch(SEMVER);
    expect(module.source.author.trim()).not.toBe("");
    expect(module.source.license.trim()).not.toBe("");
    expect(["static", "authored"]).toContain(module.contentKind);
    expect(typeof module.defaultEnabled).toBe("boolean");
    expect(module.help.title.trim()).not.toBe("");
    expect(module.help.html.trim()).not.toBe("");
    if (module.howToRead) {
      expect(module.howToRead.title.trim()).not.toBe("");
      expect(module.howToRead.html.trim()).not.toBe("");
    }
  });

  const fixtures = FIXTURES[module.id];
  const content: QuestionSetContent | null = module.contentKind === "authored" ? fixtures.content ?? module.authoring?.starterContent() ?? null : null;
  const context = { content };

  it("só o DISC nasce ligado; módulo novo nasce desligado (regra 6)", () => {
    expect(module.defaultEnabled).toBe(module.id === "disc");
  });

  it.runIf(module.contentKind === "authored")("módulo authored: declara authoring e o conteúdo de exemplo passa na validação de PUBLICAÇÃO", () => {
    expect(module.authoring).toBeDefined();
    const starter = module.authoring!.starterContent();
    expect(validateContent(starter, module.authoring!, "publish")).toEqual([]);
    expect(starter.questions.length).toBeGreaterThanOrEqual(module.authoring!.minQuestions);
  });

  it.runIf(module.contentKind === "authored")("módulo authored: gabarito e campos de pontuação NUNCA vão para o navegador (regra 3)", () => {
    const json = JSON.stringify(toRunnerContent(content!, { setId: "s", version: 1 }));
    expect(json).not.toContain("correct");
    expect(json).not.toContain("meta");
  });

  it.runIf(module.contentKind === "static")("módulo static: não declara authoring", () => {
    expect(module.authoring).toBeUndefined();
  });

  it("recusa respostas inválidas (regra 3: validar antes de pontuar)", () => {
    expect(fixtures.invalid.length).toBeGreaterThan(0);
    for (const fixture of fixtures.invalid) {
      expect(module.validateAnswers(fixture.answers, context), fixture.name).not.toBeNull();
    }
  });

  it("aceita, pontua e resume respostas válidas (regra 4: fixtures de paridade)", () => {
    expect(fixtures.valid.length).toBeGreaterThan(0);
    for (const fixture of fixtures.valid) {
      expect(module.validateAnswers(fixture.answers, context), fixture.name).toBeNull();
      const outcome = module.score(fixture.answers, context);
      expect(outcome.headline, fixture.name).toBe(fixture.expectedHeadline);
      expect(outcome.headlineSecondary ?? null, fixture.name).toBe(fixture.expectedHeadlineSecondary ?? null);
      // O dataset é gravado em jsonb: precisa sobreviver a JSON sem perder o formato.
      expect(() => JSON.stringify(outcome.dataset)).not.toThrow();
    }
  });

  it("é determinístico: mesma entrada, mesma saída", () => {
    const answers = fixtures.valid[0].answers;
    expect(module.score(answers, context)).toEqual(module.score(answers, context));
  });
});
