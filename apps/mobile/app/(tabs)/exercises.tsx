import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExerciseBrowser } from "../../src/features/exercises/components/ExerciseBrowser";

export default function ExercisesScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ExerciseBrowser
        header={
          <Text className="text-xl font-bold text-slate-900">
            {t("exercises.title")}
          </Text>
        }
      />
    </SafeAreaView>
  );
}
