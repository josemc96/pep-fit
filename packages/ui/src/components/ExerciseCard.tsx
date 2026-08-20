import type { Exercise } from "@pep-fit/shared-types";
import { Image, Pressable, Text, View } from "react-native";

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

type ExerciseCardProps = {
  exercise: Pick<
    Exercise,
    "name" | "primaryMuscle" | "equipment" | "imageUrls"
  >;
  onPress?: () => void;
};

export function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  const thumbnail = exercise.imageUrls[0];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
    >
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          className="h-16 w-16 rounded-xl bg-slate-100"
        />
      ) : (
        <View className="h-16 w-16 rounded-xl bg-slate-100" />
      )}
      <View className="flex-1">
        <Text className="font-semibold text-slate-900">{exercise.name}</Text>
        <Text className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
          {formatLabel(exercise.primaryMuscle)}
          {exercise.equipment ? ` · ${formatLabel(exercise.equipment)}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}
