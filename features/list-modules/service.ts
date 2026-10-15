import { findDefaultPublished } from "../../platform/content/store";
import { getEnabledMap } from "../../platform/modules/activation";
import { listModules } from "../../platform/modules/registry";
import type { ListModulesResult, ModuleSummary } from "./types";

export async function listModuleSummaries(scope: "active" | "all"): Promise<ListModulesResult> {
  const enabled = await getEnabledMap();
  const hasContent = new Map<string, boolean>(
    await Promise.all(listModules().map(async (module): Promise<[string, boolean]> => [module.id, module.contentKind === "authored" ? Boolean(await findDefaultPublished(module.id)) : true])),
  );
  const summaries: ModuleSummary[] = listModules().map((module) => ({
    id: module.id,
    name: module.name,
    description: module.description,
    estimatedMinutes: module.estimatedMinutes,
    version: module.version,
    contentKind: module.contentKind,
    source: module.source,
    enabled: enabled[module.id] ?? module.defaultEnabled,
    defaultEnabled: module.defaultEnabled,
    hasContent: hasContent.get(module.id) ?? true,
  }));
  return { success: true, data: scope === "active" ? summaries.filter((summary) => summary.enabled && summary.hasContent) : summaries };
}
