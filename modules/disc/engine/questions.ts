import discQuestionsData from "./disc-questions.json";
import discProfilesData from "./disc-profiles.json";

export type DiscQuestionOption = { value: string; text: string };
export type DiscQuestion = { header: string; options: DiscQuestionOption[] };

// Índice 0 do JSON original é o cabeçalho de versão do banco de perguntas ("Version
// 31.07.24.1"), sem opções reais — nunca foi exibido como pergunta (o runner do NestPro começava
// em `current = 1`). Filtrado aqui, então este array já é "as 19 perguntas reais".
export const DISC_QUESTIONS: DiscQuestion[] = (discQuestionsData.questions as DiscQuestion[]).slice(1);
export const DISC_QUESTION_BANK_VERSION = discQuestionsData.questions[0]?.header ?? "unknown";

export const DISC_HOWTO = discQuestionsData.howto;
export const DISC_VALUES = discQuestionsData.values;

export type DiscProfileEntry = { profile: string; description: string };
export const DISC_PROFILES: Record<string, DiscProfileEntry> = discProfilesData as Record<string, DiscProfileEntry>;

export function describeDiscProfile(profileKey: string): DiscProfileEntry | undefined {
  return DISC_PROFILES[profileKey.toLowerCase()];
}
