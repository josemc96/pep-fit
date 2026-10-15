import { Pressable, Text } from "react-native";

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="flex-row items-center gap-3 py-1"
    >
      <Text
        className={`h-6 w-6 rounded-md border text-center font-bold leading-6 ${
          checked
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        ✓
      </Text>
      <Text className="flex-1 text-slate-800">{label}</Text>
    </Pressable>
  );
}
