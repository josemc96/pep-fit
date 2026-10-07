import { describe, expect, it } from "vitest";

import { ExerciseFilterQuerySchema, ExerciseSchema } from "../exercise.js";

const validExercise = {
  id: "8f14e45f-ceea-467e-a01b-c1b4d1a9c123",
  name: "Barbell Bench Press",
  primaryMuscle: "chest",
  secondaryMuscles: ["triceps", "shoulders"],
  equipment: "barbell",
  category: "strength",
  imageUrls: ["https://example.com/bench-press-1.jpg"],
};

describe("ExerciseSchema", () => {
  it("parses a valid exercise", () => {
    expect(ExerciseSchema.parse(validExercise)).toEqual(validExercise);
  });

  it("rejects an invalid muscle group", () => {
    const invalid = { ...validExercise, primaryMuscle: "not_a_muscle" };
    expect(() => ExerciseSchema.parse(invalid)).toThrow();
  });

  it("rejects a missing required field", () => {
    const { name: _name, ...withoutName } = validExercise;
    expect(() => ExerciseSchema.parse(withoutName)).toThrow();
  });
});

describe("ExerciseFilterQuerySchema", () => {
  it("parses requiresWeight=false as boolean false, not a truthy string", () => {
    expect(
      ExerciseFilterQuerySchema.parse({ requiresWeight: "false" })
        .requiresWeight,
    ).toBe(false);
  });

  it("parses requiresWeight=true as boolean true", () => {
    expect(
      ExerciseFilterQuerySchema.parse({ requiresWeight: "true" })
        .requiresWeight,
    ).toBe(true);
  });

  it("applies default page and pageSize", () => {
    const parsed = ExerciseFilterQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it("defaults lang to the default locale", () => {
    expect(ExerciseFilterQuerySchema.parse({}).lang).toBe("en");
  });

  it("accepts a supported lang", () => {
    expect(ExerciseFilterQuerySchema.parse({ lang: "es" }).lang).toBe("es");
  });

  it("rejects an unsupported lang", () => {
    expect(() => ExerciseFilterQuerySchema.parse({ lang: "fr" })).toThrow();
  });
});
