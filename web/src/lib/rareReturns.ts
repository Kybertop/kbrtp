export type AbsenceStatus = "new" | "returning" | "rare" | "unverified";

export type Absence = {
  status: AbsenceStatus;
  previous: string | null;
  absentDays: number | null;
};

export function completeDays(earlier: string, later: string) {
  const start = Date.parse(`${earlier.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${later.slice(0, 10)}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function classifyAbsence(
  history: string[] | null | undefined,
  shopDate: string,
  thresholdDays: number
): Absence {
  if (!Array.isArray(history)) {
    return { status: "unverified", previous: null, absentDays: null };
  }
  const shopDay = shopDate.slice(0, 10);
  const days = [...new Set(history.map((date) => date.slice(0, 10)))]
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day) && day <= shopDay)
    .sort();
  if (days.length === 0) return { status: "unverified", previous: null, absentDays: null };
  const prior = days.filter((day) => day < shopDay);
  if (prior.length === 0) return { status: "new", previous: null, absentDays: null };
  const previous = prior[prior.length - 1];
  const absentDays = completeDays(previous, shopDay);
  if (absentDays >= thresholdDays) return { status: "rare", previous, absentDays };
  return { status: "returning", previous, absentDays };
}
