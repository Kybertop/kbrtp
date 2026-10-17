import { useEffect } from "react";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title === "KBRTP" ? title : `${title} · KBRTP`;
    if (!description) return;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}
