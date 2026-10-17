export function formatWhen(iso: string | null | undefined, language: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatDay(iso: string, language: string) {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function remainingParts(endIso: string, now = Date.now()) {
  const end = Date.parse(endIso);
  const ms = end - now;
  if (!Number.isFinite(end)) return null;
  if (ms <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
  const minutes = Math.floor(ms / 60000);
  return {
    expired: false,
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60
  };
}

export function roundCoord(value: number) {
  return Math.round(value * 100) / 100;
}
