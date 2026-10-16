import { useClerk } from "@clerk/expo";
import { LocaleSchema } from "@pep-fit/shared-types";
import { Button, Card, Chip, Screen } from "@pep-fit/ui";
import { useRouter } from "expo-router";
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
  const router = useRouter();
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
          <>
            {user?.alias ? (
              <Text className="mt-1 text-lg font-semibold text-slate-800">
                {user.alias}
              </Text>
            ) : null}
            <Text className="mt-1 text-slate-500">{user?.email}</Text>
            {user?.goal || user?.experienceLevel ? (
              <Text className="mt-1 text-sm text-slate-600">
                {[
                  user.goal ? t(`goals.${user.goal}`) : null,
                  user.experienceLevel
                    ? t(`experienceLevels.${user.experienceLevel}`)
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            ) : null}
          </>
        )}
        <View className="mt-3 gap-2">
          <Button
            variant="secondary"
            onPress={() => router.push("/profile/edit")}
          >
            {t("profileEdit.edit")}
          </Button>
          <Button
            variant="secondary"
            onPress={() => router.push("/profile/body")}
          >
            {`📏 ${t("body.open")}`}
          </Button>
          <Button
            variant="secondary"
            onPress={() => router.push("/profile/photos")}
          >
            {`📷 ${t("photos.open")}`}
          </Button>
        </View>
      </Card>
      <ProgressOverview />
      <LanguagePicker />
      <Button variant="secondary" onPress={() => signOut()}>
        {t("profile.signOut")}
      </Button>
    </Screen>
  );
}
