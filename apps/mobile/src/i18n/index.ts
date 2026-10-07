import {
  DEFAULT_LOCALE,
  LocaleSchema,
  type Locale,
} from "@pep-fit/shared-types";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

import { en } from "./locales/en";
import { es } from "./locales/es";

export const resources = {
  es: { translation: es },
  en: { translation: en },
} satisfies Record<Locale, unknown>;

/** First supported language in the device's preference list. */
export function getDeviceLocale(): Locale {
  for (const { languageCode } of getLocales()) {
    const parsed = LocaleSchema.safeParse(languageCode);
    if (parsed.success) return parsed.data;
  }
  return DEFAULT_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

/** The active UI locale, e.g. to request localized data from the API. */
export function useLocale(): Locale {
  const { i18n: instance } = useTranslation();
  return LocaleSchema.catch(DEFAULT_LOCALE).parse(instance.resolvedLanguage);
}

export { i18n };
