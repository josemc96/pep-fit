import { Alert, Platform } from "react-native";

type ConfirmOptions = {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
};

/**
 * Yes/no dialog that also works on web, where react-native-web's `Alert`
 * is a no-op.
 */
export function confirm({
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    Alert.alert(
      message,
      undefined,
      [
        { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
