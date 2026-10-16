import {
  ExperienceLevelSchema,
  GoalSchema,
  UpdateUserInputSchema,
  type ExperienceLevel,
  type Goal,
} from "@pep-fit/shared-types";
import { Button, Card, Chip, Input, NumberInput } from "@pep-fit/ui";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

import { useCurrentUser } from "../../../src/features/auth/hooks/useCurrentUser";
import { useUpdateProfileMutation } from "../../../src/features/body/api/body.queries";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfileMutation();

  const [alias, setAlias] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fill the form once the profile arrives.
  useEffect(() => {
    if (!user) return;
    setAlias(user.alias ?? "");
    setGoal(user.goal);
    setExperience(user.experienceLevel);
    setTargetWeight(user.targetWeight);
  }, [user]);

  const save = async () => {
    setError(null);
    const parsed = UpdateUserInputSchema.safeParse({
      alias: alias.trim() === "" ? null : alias.trim(),
      goal,
      experienceLevel: experience,
      targetWeight,
    });
    if (!parsed.success) {
      setError(t("profileEdit.invalid"));
      return;
    }
    try {
      await updateProfile.mutateAsync(parsed.data);
      router.back();
    } catch {
      setError(t("profileEdit.saveFailed"));
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: t("profileEdit.title") }} />

      <Card className="gap-2">
        <Text className="font-semibold text-slate-900">
          {t("profileEdit.alias")}
        </Text>
        <Input
          value={alias}
          onChangeText={setAlias}
          placeholder={t("profileEdit.aliasPlaceholder")}
          maxLength={30}
          autoCapitalize="none"
        />
        <Text className="text-xs text-slate-500">
          {t("profileEdit.aliasHint")}
        </Text>
      </Card>

      <Card className="gap-2">
        <Text className="font-semibold text-slate-900">
          {t("profileEdit.goal")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {GoalSchema.options.map((option) => (
            <Chip
              key={option}
              label={t(`goals.${option}`)}
              active={goal === option}
              onPress={() => setGoal(goal === option ? null : option)}
            />
          ))}
        </View>
      </Card>

      <Card className="gap-2">
        <Text className="font-semibold text-slate-900">
          {t("profileEdit.experience")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {ExperienceLevelSchema.options.map((option) => (
            <Chip
              key={option}
              label={t(`experienceLevels.${option}`)}
              active={experience === option}
              onPress={() =>
                setExperience(experience === option ? null : option)
              }
            />
          ))}
        </View>
      </Card>

      <Card className="gap-2">
        <Text className="font-semibold text-slate-900">
          {t("profileEdit.targetWeight")}
        </Text>
        <NumberInput
          className="w-32"
          decimal
          value={targetWeight}
          onChange={setTargetWeight}
          placeholder="–"
        />
      </Card>

      {error ? <Text className="text-red-600">{error}</Text> : null}
      <Button onPress={save} disabled={updateProfile.isPending}>
        {updateProfile.isPending
          ? t("profileEdit.saving")
          : t("profileEdit.save")}
      </Button>
    </ScrollView>
  );
}
