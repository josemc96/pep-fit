import { Card, Screen } from "@pep-fit/ui";
import { Text } from "react-native";

export default function ProfileScreen() {
  return (
    <Screen>
      <Card>
        <Text className="text-xl font-bold text-slate-900">Perfil</Text>
        <Text className="mt-1 text-slate-500">
          Nivel, puntos, medallas y evolución de peso.
        </Text>
      </Card>
    </Screen>
  );
}
