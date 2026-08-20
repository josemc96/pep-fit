import { useSSO } from "@clerk/expo";
import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import { Button, Card, Input, Screen } from "@pep-fit/ui";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { Text } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type Step = "identify" | "verify";
type Mode = "sign-in" | "sign-up";

export default function SignInScreen() {
  const {
    signIn,
    setActive: setActiveSignIn,
    isLoaded: signInLoaded,
  } = useSignIn();
  const {
    signUp,
    setActive: setActiveSignUp,
    isLoaded: signUpLoaded,
  } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [step, setStep] = useState<Step>("identify");
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = useCallback(
    async (strategy: "oauth_google" | "oauth_apple") => {
      setError(null);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch {
        setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
      }
    },
    [startSSOFlow],
  );

  const handleSendCode = useCallback(async () => {
    if (!signInLoaded || !signUpLoaded || !email) {
      return;
    }
    setError(null);

    try {
      const attempt = await signIn.create({ identifier: email });
      const emailFactor = attempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code",
      );

      if (emailFactor && "emailAddressId" in emailFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        });
      }
      setMode("sign-in");
      setStep("verify");
    } catch {
      try {
        await signUp.create({ emailAddress: email });
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setMode("sign-up");
        setStep("verify");
      } catch {
        setError("No se pudo enviar el código. Revisa el email.");
      }
    }
  }, [email, signIn, signInLoaded, signUp, signUpLoaded]);

  const handleVerifyCode = useCallback(async () => {
    if (!signInLoaded || !signUpLoaded) {
      return;
    }
    setError(null);
    try {
      if (mode === "sign-in") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code,
        });
        if (result.status === "complete" && result.createdSessionId) {
          await setActiveSignIn({ session: result.createdSessionId });
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete" && result.createdSessionId) {
          await setActiveSignUp({ session: result.createdSessionId });
        }
      }
    } catch {
      setError("Código incorrecto. Inténtalo de nuevo.");
    }
  }, [
    code,
    mode,
    setActiveSignIn,
    setActiveSignUp,
    signIn,
    signInLoaded,
    signUp,
    signUpLoaded,
  ]);

  return (
    <Screen>
      <Card>
        <Text className="text-2xl font-bold text-slate-900">pep-fit</Text>
        <Text className="mt-1 text-slate-500">
          Inicia sesión para continuar
        </Text>
      </Card>

      <Button onPress={() => handleOAuth("oauth_google")}>
        Continuar con Google
      </Button>
      <Button variant="secondary" onPress={() => handleOAuth("oauth_apple")}>
        Continuar con Apple
      </Button>

      <Card>
        {step === "identify" ? (
          <>
            <Input
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button onPress={handleSendCode}>Continuar con email</Button>
          </>
        ) : (
          <>
            <Input
              placeholder="Código recibido por email"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            <Button onPress={handleVerifyCode}>Verificar código</Button>
          </>
        )}
        {error ? <Text className="mt-2 text-red-600">{error}</Text> : null}
      </Card>
    </Screen>
  );
}
