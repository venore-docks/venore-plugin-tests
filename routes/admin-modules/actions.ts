"use server";

import { revalidatePath } from "next/cache";
import { setTestModuleEnabled } from "../../index";

export type SetModuleEnabledActionState = { error: string | null };

// A autorização (tests.modules.manage) é conferida dentro do handler — a action só repassa.
export async function setModuleEnabledAction(moduleId: string, enabled: boolean): Promise<SetModuleEnabledActionState> {
  const result = await setTestModuleEnabled({ moduleId, enabled });
  if (!result.success) {
    return { error: result.error.message };
  }
  revalidatePath("/admin/tests");
  revalidatePath("/testes");
  return { error: null };
}
