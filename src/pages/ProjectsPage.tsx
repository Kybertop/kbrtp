import { useTranslation } from "react-i18next";
import { projects } from "../content/projects";
import { usePageMeta } from "./meta";

export function ProjectsPage() {
  const { t } = useTranslation();
  usePageMeta(t("projects.title"), t("projects.lede"));
  return (
    <>
      <p className="eyebrow">{t("projects.eyebrow")}</p>
      <h1>{t("projects.title")}</h1>
      <p className="lede">{t("projects.lede")}</p>
      <div className="grid cards">
        {projects.map((project) => (
          <article className="card" key={project.id}>
            <p className="tag">{t(project.metaKey)}</p>
            <h2>{t(project.titleKey)}</h2>
            <p>{t(project.bodyKey)}</p>
            <a href={project.href}>{t("projects.visit")}</a>
          </article>
        ))}
      </div>
    </>
  );
}
