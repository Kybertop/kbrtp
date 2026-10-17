import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import ja from "../locales/ja.json";
import ru from "../locales/ru.json";
import zhCN from "../locales/zh-CN.json";
import { loadPreferences } from "../prefs/storage";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
    ru: { translation: ru },
    "zh-CN": { translation: zhCN }
  },
  lng: loadPreferences().language,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false
});

export default i18n;
