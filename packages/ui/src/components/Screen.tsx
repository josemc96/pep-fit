import type { PropsWithChildren } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
