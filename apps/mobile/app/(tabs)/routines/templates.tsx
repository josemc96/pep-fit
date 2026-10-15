import {
  TemplateEquipmentSchema,
  TemplateLevelSchema,
  type RoutineTemplateSummary,
  type TemplateEquipment,
  type TemplateLevel,
} from "@pep-fit/shared-types";
import { Card, Chip } from "@pep-fit/ui";
import { Stack, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useTemplatesQuery } from "../../../src/features/templates/api/templates.queries";
import { useLocale } from "../../../src/i18n";

/** Levels you can filter by; "all levels" templates match any of them. */
const LEVEL_FILTERS = TemplateLevelSchema.options.filter((l) => l !== "all");

function matches(
  template: RoutineTemplateSummary,
  days: number | null,
  level: TemplateLevel | null,
  equipment: TemplateEquipment | null,
) {
  return (
    (days === null || template.daysPerWeek === days) &&
    (level === null || template.level === level || template.level === "all") &&
    (equipment === null || template.equipment === equipment)
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-medium uppercase text-slate-500">
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {children}
      </ScrollView>
    </View>
  );
}

export default function TemplatesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const { data: templates, isLoading, isError } = useTemplatesQuery(lang);
  const [days, setDays] = useState<number | null>(null);
  const [level, setLevel] = useState<TemplateLevel | null>(null);
  const [equipment, setEquipment] = useState<TemplateEquipment | null>(null);

  const dayOptions = [...new Set(templates?.map((t) => t.daysPerWeek))].sort(
    (a, b) => a - b,
  );
  const visible = templates?.filter((template) =>
    matches(template, days, level, equipment),
  );

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen options={{ title: t("templates.title") }} />
      <Text className="text-slate-600">{t("templates.intro")}</Text>

      <FilterRow label={t("templates.filterDays")}>
        <Chip
          label={t("common.all")}
          active={days === null}
          onPress={() => setDays(null)}
        />
        {dayOptions.map((option) => (
          <Chip
            key={option}
            label={String(option)}
            active={days === option}
            onPress={() => setDays(option === days ? null : option)}
          />
        ))}
      </FilterRow>
      <FilterRow label={t("templates.filterLevel")}>
        <Chip
          label={t("common.all")}
          active={level === null}
          onPress={() => setLevel(null)}
        />
        {LEVEL_FILTERS.map((option) => (
          <Chip
            key={option}
            label={t(`templates.levels.${option}`)}
            active={level === option}
            onPress={() => setLevel(option === level ? null : option)}
          />
        ))}
      </FilterRow>
      <FilterRow label={t("templates.filterEquipment")}>
        <Chip
          label={t("common.all")}
          active={equipment === null}
          onPress={() => setEquipment(null)}
        />
        {TemplateEquipmentSchema.options.map((option) => (
          <Chip
            key={option}
            label={t(`templates.equipment.${option}`)}
            active={equipment === option}
            onPress={() => setEquipment(option === equipment ? null : option)}
          />
        ))}
      </FilterRow>

      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : isError ? (
        <Text className="text-red-600">{t("templates.loadError")}</Text>
      ) : visible?.length === 0 ? (
        <Text className="text-slate-500">{t("templates.empty")}</Text>
      ) : (
        visible?.map((template) => (
          <Pressable
            key={template.id}
            onPress={() => router.push(`/routines/template/${template.id}`)}
          >
            <Card className="gap-1">
              <Text className="text-base font-semibold text-slate-900">
                {template.name}
              </Text>
              <Text className="text-sm text-slate-600">
                {template.description}
              </Text>
              <Text className="mt-1 text-xs font-medium uppercase text-indigo-700">
                {[
                  t("templates.daysPerWeek", { count: template.daysPerWeek }),
                  t(`templates.levels.${template.level}`),
                  t(`templates.equipment.${template.equipment}`),
                ].join(" · ")}
              </Text>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
