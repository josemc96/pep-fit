import "i18next";

import type { es } from "./locales/es";

// Makes `t("some.key")` type-checked against the Spanish source translations.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof es };
  }
}
