import { useSSO } from "@clerk/expo";
import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import { Button, Card, Input, Screen } from "@pep-fit/ui";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type Step = "identify" | "verify";
type Mode = "sign-in" | "sign-up";

export default function SignInScreen() {
  const { t } = useTranslation();
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
      } catch (err) {
        console.error("OAuth sign-in failed", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(t("auth.errors.oauth", { message }));
      }
    },
    [startSSOFlow, t],
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
        setError(t("auth.errors.sendCode"));
      }
    }
  }, [email, signIn, signInLoaded, signUp, signUpLoaded, t]);

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
      setError(t("auth.errors.invalidCode"));
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
    t,
  ]);

  return (
    <Screen>
      <Card>
        <Text className="text-2xl font-bold text-slate-900">pep-fit</Text>
        <Text className="mt-1 text-slate-500">{t("auth.subtitle")}</Text>
      </Card>

      <Button onPress={() => handleOAuth("oauth_google")}>
        {t("auth.continueWithGoogle")}
      </Button>
      <Button variant="secondary" onPress={() => handleOAuth("oauth_apple")}>
        {t("auth.continueWithApple")}
      </Button>

      <Card>
        {step === "identify" ? (
          <>
            <Input
              placeholder={t("auth.emailPlaceholder")}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button onPress={handleSendCode}>
              {t("auth.continueWithEmail")}
            </Button>
          </>
        ) : (
          <>
            <Input
              placeholder={t("auth.codePlaceholder")}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            <Button onPress={handleVerifyCode}>{t("auth.verifyCode")}</Button>
          </>
        )}
        {error ? <Text className="mt-2 text-red-600">{error}</Text> : null}
      </Card>

      {/* Clerk's bot-protection widget mounts here on web (see clerk.com/docs/guides/development/custom-flows/authentication/bot-sign-up-protection) */}
      <View nativeID="clerk-captcha" />
    </Screen>
  );
}
