import { Button, Card, Screen } from "@pep-fit/ui";
import { Text } from "react-native";

export default function DashboardScreen() {
  return (
    <Screen>
      <Card>
        <Text className="text-xl font-bold text-slate-900">Dashboard</Text>
        <Text className="mt-1 text-slate-500">
          Aquí verás tu rutina activa, tu nivel y tu progreso.
        </Text>
      </Card>
      <Button onPress={() => {}}>Empezar entrenamiento de hoy</Button>
    </Screen>
  );
}
