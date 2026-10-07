import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Locale } from "@pep-fit/shared-types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** "system" follows the device language. */
export type LanguagePreference = Locale | "system";

interface LanguageState {
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: "pep-fit-language",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
