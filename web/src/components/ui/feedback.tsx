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
      <path d="M48 148c0-64 36-108 112-108s112 44 112 108c0 30-18 48-54 48H102c-36 0-54-18-54-48z" fill="var(--lime)" stroke="currentColor" strokeWidth="8" />
      <path d="M78 128h164" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
      <path d="M108 162c26 18 78 18 104 0" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
