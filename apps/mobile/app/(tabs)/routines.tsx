import { Card, Screen } from "@gym-app/ui";
import { Text } from "react-native";

export default function RoutinesScreen() {
  return (
    <Screen>
      <Card>
        <Text className="text-xl font-bold text-slate-900">Mis rutinas</Text>
        <Text className="mt-1 text-slate-500">
          Aquí verás y gestionarás tus rutinas de entrenamiento.
        </Text>
      </Card>
    </Screen>
  );
}
