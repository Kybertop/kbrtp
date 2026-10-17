export const widgetCatalog = [
  { id: "weather", home: true },
  { id: "steam", home: true },
  { id: "epic", home: true },
  { id: "shrine", home: false }
] as const;

export type WidgetId = (typeof widgetCatalog)[number]["id"];

export const defaultHomeWidgets: WidgetId[] = widgetCatalog.filter((widget) => widget.home).map((widget) => widget.id);
