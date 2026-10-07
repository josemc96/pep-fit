import { Button, Card, Screen } from "@pep-fit/ui";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

export default function DashboardScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Card>
        <Text className="text-xl font-bold text-slate-900">
          {t("dashboard.title")}
        </Text>
        <Text className="mt-1 text-slate-500">
          {t("dashboard.description")}
        </Text>
      </Card>
      <Button onPress={() => {}}>{t("dashboard.startWorkout")}</Button>
    </Screen>
  );
}
