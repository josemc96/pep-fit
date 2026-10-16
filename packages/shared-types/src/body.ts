import { z } from "zod";

/**
 * Body metrics a user can log. Every one is optional (log what you have),
 * with sane bounds to catch typos like 800 kg.
 */
export const BODY_METRICS = {
  weightKg: { unit: "kg", min: 20, max: 400 },
  bodyFatPct: { unit: "%", min: 2, max: 70 },
  waistCm: { unit: "cm", min: 30, max: 250 },
  hipsCm: { unit: "cm", min: 30, max: 250 },
  chestCm: { unit: "cm", min: 30, max: 250 },
  armCm: { unit: "cm", min: 10, max: 100 },
  thighCm: { unit: "cm", min: 20, max: 150 },
} as const;

export type BodyMetric = keyof typeof BODY_METRICS;
export const BODY_METRIC_KEYS = Object.keys(BODY_METRICS) as BodyMetric[];

/** A local calendar date, "YYYY-MM-DD". */
export const DayKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
    message: "Invalid date",
  });

const metric = (key: BodyMetric) =>
  z.number().min(BODY_METRICS[key].min).max(BODY_METRICS[key].max).nullable();

const metricsShape = Object.fromEntries(
  BODY_METRIC_KEYS.map((key) => [key, metric(key)]),
) as { [K in BodyMetric]: ReturnType<typeof metric> };

export const BodyMeasurementInputSchema = z
  .object(metricsShape)
  .refine((input) => BODY_METRIC_KEYS.some((key) => input[key] !== null), {
    message: "Log at least one value",
  });
export type BodyMeasurementInput = z.infer<typeof BodyMeasurementInputSchema>;

export const BodyMeasurementSchema = z.object({
  measuredOn: DayKeySchema,
  ...metricsShape,
});
export type BodyMeasurement = z.infer<typeof BodyMeasurementSchema>;
