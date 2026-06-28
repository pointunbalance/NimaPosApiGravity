export type AppMode = "starter" | "standard" | "service" | "enterprise";

const rawMode = (import.meta.env.VITE_NIMA_APP_MODE ?? "starter") as AppMode;

export const appMode: AppMode = ["starter", "standard", "service", "enterprise"].includes(rawMode)
  ? rawMode
  : "starter";

export const modeMeta: Record<AppMode, { label: string; description: string }> = {
  starter: {
    label: "Starter",
    description: "Core POS workflow with lean navigation."
  },
  standard: {
    label: "Standard",
    description: "Expanded operations for inventory, purchasing, and retention."
  },
  service: {
    label: "Service",
    description: "Sales shell optimized for service-led workflows."
  },
  enterprise: {
    label: "Enterprise",
    description: "Full business operating surface with advanced finance and governance."
  }
};
