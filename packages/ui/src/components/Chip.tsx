import { Pressable, Text } from "react-native";

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function Chip({ label, active, onPress }: ChipProps) {
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
        {label}
      </Text>
    </Pressable>
  );
}
