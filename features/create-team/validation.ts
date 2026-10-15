import type { CreateTeamInput } from "./types";

export function validateCreateTeamInput(input: CreateTeamInput): { code: string; message: string } | null {
  if (!input.name || !input.name.trim()) {
    return { code: "missing_name", message: "Informe um nome para a equipe." };
  }
  if (input.name.trim().length > 120) {
    return { code: "name_too_long", message: "O nome da equipe pode ter até 120 caracteres." };
  }
  return null;
}
