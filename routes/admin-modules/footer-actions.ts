"use server";

import { revalidatePath } from "next/cache";
import { isPluginActive } from "@venore/plugin-sdk";
import { setSetting } from "@venore/plugin-sdk/settings";
import { normalizeFooterText, REPORT_FOOTER_SETTING } from "../../shared/report-settings";

export type SaveFooterActionState = { error: string | null; saved: boolean };

// Gravar exige settings.manage ou tests.settings.manage — conferido pelo handler do core.
export async function saveReportFooterAction(_previous: SaveFooterActionState, formData: FormData): Promise<SaveFooterActionState> {
  if (!(await isPluginActive("tests"))) {
    return { error: "O plugin Testes não está ativo.", saved: false };
  }
  const value = normalizeFooterText(String(formData.get("footerText") ?? ""));
  const result = await setSetting({ key: REPORT_FOOTER_SETTING.key, value });
  if (!result.success) {
    return { error: result.error.message, saved: false };
  }
  revalidatePath("/admin/tests");
  revalidatePath("/testes", "layout");
  return { error: null, saved: true };
}
