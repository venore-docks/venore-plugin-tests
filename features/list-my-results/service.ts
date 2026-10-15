import { getModule } from "../../platform/modules/registry";
import { findResultsByUser } from "./store";
import type { ListMyResultsResult } from "./types";

export async function listMyResults(userId: string): Promise<ListMyResultsResult> {
  const rows = await findResultsByUser(userId);
  return {
    success: true,
    data: rows.map((row) => {
      const module = getModule(row.testId);
      return {
        id: row.id,
        testId: row.testId,
        testName: module?.name ?? row.testId,
        contextLabel: row.contextLabel,
        label: module?.describeHeadline?.(row.headline, row.headlineSecondary) ?? row.headline,
        createdAt: row.createdAt,
      };
    }),
  };
}
