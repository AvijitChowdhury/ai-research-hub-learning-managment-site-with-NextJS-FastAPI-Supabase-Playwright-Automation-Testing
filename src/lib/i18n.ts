// Minimal, swappable localization layer (PRD §12).
// All UI copy that should be locale-swappable eventually goes here.
// For v1 we ship a single locale ("en") and format currency/dates via Intl.

export type Locale = "en";

const strings: Record<Locale, Record<string, string>> = {
  en: {
    "orders.title": "Order history",
    "orders.empty": "You have no orders yet.",
    "profile.title": "Profile",
    "profile.saved": "Profile updated.",
    "profile.password_changed": "Password updated.",
    "auth.forgot": "Forgot password?",
    "auth.reset_email_sent": "If that email is registered, a reset link has been sent.",
    "analytics.title": "Analytics",
    "instructors.title": "Instructors",
    "reviews.moderation": "Review moderation",
    "csv.import": "Bulk lesson import",
  },
};

let current: Locale = "en";
export function setLocale(l: Locale) { current = l; }
export function t(key: string): string {
  return strings[current][key] ?? key;
}

// Locale + currency come from configuration, not hard-coded per market.
export const localeConfig = {
  locale: "en-US",
  currency: "USD",
  timezone: undefined as string | undefined,
};

export function fmtCurrency(amount: number, currency = localeConfig.currency) {
  return new Intl.NumberFormat(localeConfig.locale, { style: "currency", currency }).format(amount);
}
export function fmtDate(d: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(localeConfig.locale, opts ?? { dateStyle: "medium" }).format(date);
}
export function fmtDateTime(d: Date | string) {
  return fmtDate(d, { dateStyle: "medium", timeStyle: "short" });
}
