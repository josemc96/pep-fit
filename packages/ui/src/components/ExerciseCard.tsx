import type { Exercise } from "@pep-fit/shared-types";
import { Image, Pressable, Text, View } from "react-native";

type ExerciseCardProps = {
  exercise: Pick<Exercise, "name" | "imageUrls">;
  /** Already-localized secondary line, e.g. "Pecho · Barra". */
  subtitle?: string;
  onPress?: () => void;
};

export function ExerciseCard({
  exercise,
  subtitle,
  onPress,
}: ExerciseCardProps) {
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
        {subtitle ? (
          <Text className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
