import type { OperationResult } from "@venore/plugin-sdk";
import type { TestResultView } from "../../contracts/types";

export type GetResultQuery = {
  resultId: string;
  // Quem está vendo (conta logada) ou nulo.
  viewerId: string | null;
  // Resultados que ESTE navegador ganhou o direito de ver ao responder sem login (cookie de acesso
  // temporário). Ver routes/run/actions.ts.
  capabilityResultIds: string[];
};

// Códigos de erro com significado para a tela:
//  - not_found: não existe;
//  - login_required: existe, mas só quem entrar vê (a tela leva ao login);
//  - not_claimed: resposta avulsa ainda sem dono e quem pediu está logado → a tela reivindica e relê;
//  - forbidden: existe e é de outra pessoa.
export type GetResultResult = OperationResult<TestResultView>;
