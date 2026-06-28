import type { ReactNode } from "react";

import type { AppMode } from "./appMode";
import { routeCatalog, type RouteGroupId } from "./routeCatalog";

export type NavigationItem = {
  path: string;
  label: string;
  description: string;
  icon: ReactNode;
  modes: AppMode[];
};

export type NavigationGroup = {
  id: string;
  label: string;
  items: NavigationItem[];
};

const orderedGroups: RouteGroupId[] = [
  "main",
  "sales",
  "customers",
  "products",
  "inventory",
  "projects",
  "logistics",
  "finance",
  "accounting",
  "admin"
];

export function getVisibleNavigation(mode: AppMode, groupLabels: Record<RouteGroupId, string>): NavigationGroup[] {
  return orderedGroups
    .map((groupId) => ({
      id: groupId,
      label: groupLabels[groupId],
      items: routeCatalog.filter((item) => item.group === groupId && item.modes.includes(mode))
    }))
    .filter((group) => group.items.length > 0);
}
