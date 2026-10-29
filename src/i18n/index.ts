import { th, type Messages } from "./th";

/** Single place to switch locales later (cookie, route segment, etc.). */
export const messages: Messages = th;
export const t = messages;
export const locale = "th" as const;
