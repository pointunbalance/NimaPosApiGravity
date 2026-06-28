import { arMessages } from "./ar";
import { enMessages } from "./en";

export const appLocale = "ar";

export const messages = appLocale === "ar" ? arMessages : enMessages;

export type AppMessages = typeof arMessages;
