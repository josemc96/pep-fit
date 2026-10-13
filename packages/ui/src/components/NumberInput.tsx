import { useEffect, useState } from "react";
import { TextInput } from "react-native";

type NumberInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Accepts decimals (either "," or "." as separator). */
  decimal?: boolean;
  placeholder?: string;
  className?: string;
};

function parse(text: string, decimal: boolean): number | null {
  const normalized = text.replace(",", ".").trim();
  if (normalized === "") return null;
  const value = decimal
    ? Number.parseFloat(normalized)
    : Number.parseInt(normalized, 10);
  return Number.isFinite(value) ? value : null;
}

/**
 * Numeric field that keeps the raw text while typing (so "2." or "2," aren't
 * swallowed) and reports the parsed number, or null when empty.
 */
export function NumberInput({
  value,
  onChange,
  decimal = false,
  placeholder,
  className,
}: NumberInputProps) {
  const [text, setText] = useState(value === null ? "" : String(value));

  // Sync external changes (e.g. a new set copied from the previous one)
  // without clobbering partially typed input that parses to the same value.
  // Deliberately keyed on `value` only: reacting to `text` would undo typing.
  useEffect(() => {
    if (parse(text, decimal) !== value) {
      setText(value === null ? "" : String(value));
    }
  }, [value]);

  return (
    <TextInput
      value={text}
      onChangeText={(next) => {
        const allowed = decimal ? /^\d*[.,]?\d*$/ : /^\d*$/;
        if (!allowed.test(next)) return;
        setText(next);
        onChange(parse(next, decimal));
      }}
      keyboardType={decimal ? "decimal-pad" : "number-pad"}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      className={`rounded-lg border border-slate-300 px-2 py-1.5 text-center text-base text-slate-900 ${className ?? ""}`}
    />
  );
}
