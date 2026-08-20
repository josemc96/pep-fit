import { TextInput, type TextInputProps } from "react-native";

export function Input(props: TextInputProps) {
  return (
    <TextInput
      className="rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900"
      placeholderTextColor="#94a3b8"
      {...props}
    />
  );
}
