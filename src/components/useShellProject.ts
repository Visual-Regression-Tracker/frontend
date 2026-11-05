import { useVariationCrumb } from "../contexts";
import type { ProjectTab, ShellRoute } from "../_helpers/route.helpers";

export const useShellProject = (
  route: ShellRoute,
): { projectId: string; tab: ProjectTab } | undefined => {
  const variation = useVariationCrumb();

  if (route.kind === "project") {
    return { projectId: route.projectId, tab: route.tab };
  }
  if (route.kind === "variation" && variation) {
    return { projectId: variation.projectId, tab: "variations" };
  }
  return undefined;
};
