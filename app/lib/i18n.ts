import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import nl from "./locales/nl";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: en },
    nl: { translation: nl },
  },
});

export default i18n;
