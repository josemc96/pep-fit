import { useClerk } from "@clerk/expo";
import { Button, Card, Screen } from "@pep-fit/ui";
import { Text } from "react-native";

import { useCurrentUser } from "../../src/features/auth/hooks/useCurrentUser";

export default function ProfileScreen() {
  const { signOut } = useClerk();
  const { data: user, isLoading, isError } = useCurrentUser();

  return (
    <Screen>
      <Card>
        <Text className="text-xl font-bold text-slate-900">Perfil</Text>
        {isLoading ? (
          <Text className="mt-1 text-slate-500">Cargando...</Text>
        ) : isError ? (
          <Text className="mt-1 text-red-600">
            No se pudo cargar tu perfil.
          </Text>
        ) : (
          <Text className="mt-1 text-slate-500">{user?.email}</Text>
        )}
      </Card>
      <Button variant="secondary" onPress={() => signOut()}>
        Cerrar sesión
      </Button>
    </Screen>
  );
}
