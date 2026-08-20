import type { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView } from "react-native";

type ScreenProps = PropsWithChildren<{ className?: string }>;

export function Screen({ children, className }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className={className}
        contentContainerClassName="flex-1 gap-4 p-4"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
