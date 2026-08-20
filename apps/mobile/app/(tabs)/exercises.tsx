import { Card, Screen } from "@gym-app/ui";
import { Text } from "react-native";

export default function ExercisesScreen() {
  return (
    <Screen>
      <Card>
        <Text className="text-xl font-bold text-slate-900">Ejercicios</Text>
        <Text className="mt-1 text-slate-500">
          Catálogo de ejercicios filtrable por músculo y equipamiento.
        </Text>
      </Card>
    </Screen>
  );
}
