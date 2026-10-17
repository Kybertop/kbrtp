import { ZodError } from "zod";
import { HttpError, TimeoutError } from "../../lib/http";

export function errorKey(error: unknown) {
  if (error instanceof TimeoutError) return "errors.timeout";
  if (error instanceof HttpError && error.status === 429) return "errors.rate";
  if (error instanceof ZodError) return "errors.validation";
  return "errors.network";
}

export function errorText(error: unknown, t: (key: string) => string) {
  return t(errorKey(error));
}

export function LoadingBlock() {
  return (
    <div className="stack" aria-busy="true">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}

export function HelmetMark() {
  return (
    <svg className="visor" viewBox="0 0 320 220" aria-hidden="true">
      <path d="M46 150c0-62 38-104 114-104s114 42 114 104c0 28-18 46-52 46H98c-34 0-52-18-52-46z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M78 132h164" stroke="var(--lime)" strokeWidth="8" strokeLinecap="round" />
      <path d="M104 164c28 22 84 22 112 0" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
