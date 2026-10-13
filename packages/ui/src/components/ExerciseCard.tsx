import type { Exercise } from "@pep-fit/shared-types";
import { Image, Pressable, Text, View } from "react-native";

type ExerciseCardProps = {
  exercise: Pick<Exercise, "name" | "imageUrls">;
  /** Already-localized secondary line, e.g. "Pecho · Barra". */
  subtitle?: string;
  /** Highlights the card and shows a check mark. */
  selected?: boolean;
  onPress?: () => void;
};

export function ExerciseCard({
  exercise,
  subtitle,
  selected = false,
  onPress,
}: ExerciseCardProps) {
  const thumbnail = exercise.imageUrls[0];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-3 rounded-2xl border bg-white p-3 ${
        selected ? "border-indigo-600" : "border-slate-200"
      }`}
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
      {selected ? (
        <Text className="text-lg font-bold text-indigo-600">✓</Text>
      ) : null}
    </Pressable>
  );
}
