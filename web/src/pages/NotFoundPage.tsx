import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "./meta";

export function NotFoundPage() {
  const { t } = useTranslation();
  usePageMeta(t("notFound.title"));
  return (
    <>
      <h1>{t("notFound.title")}</h1>
      <p className="lede">{t("notFound.body")}</p>
      <Link className="cta" to="/">{t("nav.home")}</Link>
    </>
  );
}
