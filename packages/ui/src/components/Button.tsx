import type { PropsWithChildren } from "react";
import { Pressable, Text } from "react-native";

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}>;

const VARIANT_STYLES = {
  primary: { container: "bg-indigo-600", text: "text-white" },
  secondary: { container: "bg-slate-100", text: "text-slate-900" },
  danger: { container: "bg-red-50", text: "text-red-700" },
} as const;

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`items-center rounded-xl px-4 py-3 ${styles.container} ${disabled ? "opacity-50" : ""}`}
    >
      <Text className={`font-semibold ${styles.text}`}>{children}</Text>
    </Pressable>
  );
}
