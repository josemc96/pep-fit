import type { PropsWithChildren } from "react";
import { Pressable, Text } from "react-native";

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  variant?: "primary" | "secondary";
}>;

export function Button({
  children,
  onPress,
  variant = "primary",
}: ButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      className={`items-center rounded-xl px-4 py-3 ${isPrimary ? "bg-indigo-600" : "bg-slate-100"}`}
    >
      <Text
        className={`font-semibold ${isPrimary ? "text-white" : "text-slate-900"}`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
