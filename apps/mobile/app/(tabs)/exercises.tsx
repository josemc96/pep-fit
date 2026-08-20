import {
  EquipmentSchema,
  MuscleGroupSchema,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from "@pep-fit/shared-types";
import { ExerciseCard } from "@pep-fit/ui";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useExercisesQuery } from "../../src/features/exercises/api/useExercisesQuery";

const MUSCLES = MuscleGroupSchema.options;
const EQUIPMENT = EquipmentSchema.options;

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
      }`}
    >
      <Text
        className={`text-xs font-medium ${active ? "text-white" : "text-slate-700"}`}
      >
        {formatLabel(label)}
      </Text>
    </Pressable>
  );
}

export default function ExercisesScreen() {
  const [muscle, setMuscle] = useState<MuscleGroup | undefined>();
  const [equipment, setEquipment] = useState<Equipment | undefined>();
  const [requiresWeight, setRequiresWeight] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Exercise[]>([]);

  useEffect(() => {
    setPage(1);
  }, [muscle, equipment, requiresWeight]);

  const { data, isLoading, isFetching, isError } = useExercisesQuery({
    muscle,
    equipment,
    requiresWeight,
    page,
  });

  useEffect(() => {
    if (!data) return;
    setItems((prev) =>
      data.page === 1 ? data.items : [...prev, ...data.items],
    );
  }, [data]);

  const canLoadMore = data ? data.page * data.pageSize < data.total : false;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="gap-3 border-b border-slate-200 bg-white px-4 pb-3 pt-4">
        <Text className="text-xl font-bold text-slate-900">Ejercicios</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          <Chip
            label="Todos"
            active={!muscle}
            onPress={() => setMuscle(undefined)}
          />
          {MUSCLES.map((option) => (
            <Chip
              key={option}
              label={option}
              active={muscle === option}
              onPress={() => setMuscle(option === muscle ? undefined : option)}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          <Chip
            label="Cualquier equipo"
            active={!equipment}
            onPress={() => setEquipment(undefined)}
          />
          {EQUIPMENT.map((option) => (
            <Chip
              key={option}
              label={option}
              active={equipment === option}
              onPress={() =>
                setEquipment(option === equipment ? undefined : option)
              }
            />
          ))}
        </ScrollView>

        <View className="flex-row gap-2">
          <Chip
            label="Todos"
            active={requiresWeight === undefined}
            onPress={() => setRequiresWeight(undefined)}
          />
          <Chip
            label="Con peso"
            active={requiresWeight === true}
            onPress={() => setRequiresWeight(true)}
          />
          <Chip
            label="Sin peso"
            active={requiresWeight === false}
            onPress={() => setRequiresWeight(false)}
          />
        </View>
      </View>

      {isError ? (
        <Text className="p-4 text-red-600">
          No se pudo cargar el catálogo de ejercicios.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExerciseCard exercise={item} />}
          contentContainerClassName="gap-2 p-4"
          ListEmptyComponent={
            isLoading ? (
              <Text className="text-slate-500">Cargando...</Text>
            ) : (
              <Text className="text-slate-500">
                Ningún ejercicio coincide con estos filtros.
              </Text>
            )
          }
          ListFooterComponent={
            canLoadMore ? (
              <Pressable
                onPress={() => setPage((prev) => prev + 1)}
                disabled={isFetching}
                className="items-center rounded-xl border border-slate-300 bg-white py-3"
              >
                <Text className="font-medium text-slate-700">
                  {isFetching ? "Cargando..." : "Cargar más"}
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
