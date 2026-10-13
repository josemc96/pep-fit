import { Pressable, Text, View } from "react-native";

import { IconButton } from "./IconButton";
import { NumberInput } from "./NumberInput";

export type SetTableRow = {
  /** Stable React key. */
  key: string;
  reps: number | null;
  weightKg: number | null;
};

export type SetTableLabels = {
  set: string;
  reps: string;
  weight: string;
  addSet: string;
  removeSet: string;
};

type SetTableProps = {
  rows: SetTableRow[];
  labels: SetTableLabels;
  onChangeRow: (
    index: number,
    patch: Partial<Omit<SetTableRow, "key">>,
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  /** Keeps at least this many rows (remove is disabled below it). */
  minRows?: number;
  maxRows?: number;
};

/**
 * Editable table of sets (# · weight · reps). Generic on purpose: routines use
 * it for planned sets, and workout logging will reuse it for performed sets.
 */
export function SetTable({
  rows,
  labels,
  onChangeRow,
  onAddRow,
  onRemoveRow,
  minRows = 1,
  maxRows,
}: SetTableProps) {
  const canAdd = maxRows === undefined || rows.length < maxRows;

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-2">
        <Text className="w-10 text-xs font-medium uppercase text-slate-500">
          {labels.set}
        </Text>
        <Text className="flex-1 text-center text-xs font-medium uppercase text-slate-500">
          {labels.weight}
        </Text>
        <Text className="flex-1 text-center text-xs font-medium uppercase text-slate-500">
          {labels.reps}
        </Text>
        <View className="w-8" />
      </View>

      {rows.map((row, index) => (
        <View key={row.key} className="flex-row items-center gap-2">
          <Text className="w-10 font-semibold text-slate-700">{index + 1}</Text>
          <NumberInput
            className="flex-1"
            decimal
            value={row.weightKg}
            onChange={(weightKg) => onChangeRow(index, { weightKg })}
            placeholder="–"
          />
          <NumberInput
            className="flex-1"
            value={row.reps}
            onChange={(reps) => onChangeRow(index, { reps })}
            placeholder="–"
          />
          <IconButton
            icon="✕"
            accessibilityLabel={labels.removeSet}
            onPress={() => onRemoveRow(index)}
            disabled={rows.length <= minRows}
          />
        </View>
      ))}

      {canAdd ? (
        <Pressable onPress={onAddRow} className="self-start py-1">
          <Text className="font-medium text-indigo-600">{labels.addSet}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
