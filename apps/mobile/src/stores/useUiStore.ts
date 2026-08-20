import { create } from "zustand";

interface UiState {
  isOnboardingBannerDismissed: boolean;
  dismissOnboardingBanner: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isOnboardingBannerDismissed: false,
  dismissOnboardingBanner: () => set({ isOnboardingBannerDismissed: true }),
}));
