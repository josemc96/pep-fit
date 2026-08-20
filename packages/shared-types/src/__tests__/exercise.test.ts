import { describe, expect, it } from "vitest";

import { ExerciseSchema } from "../exercise.js";

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
