import { useClerk } from "@clerk/expo";
import { LocaleSchema } from "@pep-fit/shared-types";
import { Button, Card, Chip, Screen } from "@pep-fit/ui";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useCurrentUser } from "../../../src/features/auth/hooks/useCurrentUser";
import { ProgressOverview } from "../../../src/features/progress/components/ProgressOverview";
import { useLanguageStore } from "../../../src/stores/useLanguageStore";

function LanguagePicker() {
  const { t } = useTranslation();
  const preference = useLanguageStore((state) => state.preference);
  const setPreference = useLanguageStore((state) => state.setPreference);

  return (
    <Card>
      <Text className="font-semibold text-slate-900">
        {t("profile.language")}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        <Chip
          label={t("profile.languageSystem")}
          active={preference === "system"}
          onPress={() => setPreference("system")}
        />
        {LocaleSchema.options.map((locale) => (
          <Chip
            key={locale}
            label={t(`languageNames.${locale}`)}
            active={preference === locale}
            onPress={() => setPreference(locale)}
          />
        ))}
      </View>
    </Card>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { signOut } = useClerk();
  const { data: user, isLoading, isError } = useCurrentUser();

  return (
    <Screen>
      <Card>
        <Text className="text-xl font-bold text-slate-900">
          {t("profile.title")}
        </Text>
        {isLoading ? (
          <Text className="mt-1 text-slate-500">{t("common.loading")}</Text>
        ) : isError ? (
          <Text className="mt-1 text-red-600">{t("profile.loadError")}</Text>
        ) : (
          <Text className="mt-1 text-slate-500">{user?.email}</Text>
        )}
      </Card>
      <ProgressOverview />
      <LanguagePicker />
      <Button variant="secondary" onPress={() => signOut()}>
        {t("profile.signOut")}
      </Button>
    </Screen>
  );
}
