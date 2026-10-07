import { Card, Screen } from "@pep-fit/ui";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

export default function RoutinesScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Card>
        <Text className="text-xl font-bold text-slate-900">
          {t("routines.title")}
        </Text>
        <Text className="mt-1 text-slate-500">{t("routines.description")}</Text>
      </Card>
    </Screen>
  );
}
