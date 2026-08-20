import type { PropsWithChildren } from "react";
import { View } from "react-native";

type CardProps = PropsWithChildren<{ className?: string }>;

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className ?? ""}`}
    >
      {children}
    </View>
  );
}
