import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export type RestTimerLabels = {
  title: string;
  done: string;
  addTime: string;
  skip: string;
};

type RestTimerProps = {
  /** Epoch ms when the rest is over; a timestamp keeps it right across
   *  re-renders, navigation and the app being backgrounded. */
  endsAt: number;
  totalSeconds: number;
  labels: RestTimerLabels;
  onAddTime: () => void;
  onSkip: () => void;
};

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}

export function RestTimer({
  endsAt,
  totalSeconds,
  labels,
  onAddTime,
  onSkip,
}: RestTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, (endsAt - now) / 1000);
  const isDone = remaining === 0;
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 1;

  return (
    <View
      className={`gap-2 border-t px-4 pb-3 pt-2 ${
        isDone
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <View className="h-1 overflow-hidden rounded-full bg-slate-200">
        <View
          className={`h-1 ${isDone ? "bg-emerald-600" : "bg-indigo-600"}`}
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </View>
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-xs font-medium uppercase text-slate-500">
            {isDone ? labels.done : labels.title}
          </Text>
          <Text
            className={`text-2xl font-bold tabular-nums ${isDone ? "text-emerald-700" : "text-slate-900"}`}
          >
            {formatClock(Math.ceil(remaining))}
          </Text>
        </View>
        <Pressable
          onPress={onAddTime}
          className="rounded-xl bg-slate-100 px-3 py-2"
        >
          <Text className="font-semibold text-slate-900">{labels.addTime}</Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          className="rounded-xl bg-indigo-600 px-3 py-2"
        >
          <Text className="font-semibold text-white">{labels.skip}</Text>
        </Pressable>
      </View>
    </View>
  );
}
