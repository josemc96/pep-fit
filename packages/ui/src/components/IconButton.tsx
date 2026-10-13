import { Pressable, Text } from "react-native";

type IconButtonProps = {
  /** A short glyph such as "↑", "↓" or "✕". */
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  tone?: "default" | "danger";
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
  tone = "default",
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      className={`h-8 w-8 items-center justify-center rounded-lg ${
        disabled ? "opacity-30" : "active:bg-slate-100"
      }`}
    >
      <Text
        className={`text-base font-semibold ${tone === "danger" ? "text-red-600" : "text-slate-600"}`}
      >
        {icon}
      </Text>
    </Pressable>
  );
}
