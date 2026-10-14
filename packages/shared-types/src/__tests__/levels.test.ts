import { describe, expect, it } from "vitest";

import { ACHIEVEMENTS, ACHIEVEMENT_IDS, tierFor } from "../achievements.js";
import { LEVEL_THRESHOLDS, levelForPoints } from "../levels.js";

describe("levelForPoints", () => {
  it("starts at Recruit I", () => {
    expect(levelForPoints(0)).toEqual({
      index: 0,
      rank: "recruit",
      sublevel: 1,
      minPoints: 0,
      nextMinPoints: 50,
    });
  });

  it("moves through sub-levels and ranks", () => {
    expect(levelForPoints(49)).toMatchObject({ rank: "recruit", sublevel: 1 });
    expect(levelForPoints(50)).toMatchObject({ rank: "recruit", sublevel: 2 });
    expect(levelForPoints(220)).toMatchObject({ rank: "soldier", sublevel: 1 });
  });

  it("tops out at Legend III", () => {
    expect(levelForPoints(1_000_000)).toMatchObject({
      index: 17,
      rank: "legend",
      sublevel: 3,
      nextMinPoints: null,
    });
  });

  it("has strictly increasing thresholds", () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(18);
    LEVEL_THRESHOLDS.slice(1).forEach((threshold, i) =>
      expect(threshold).toBeGreaterThan(LEVEL_THRESHOLDS[i]!),
    );
  });
});

describe("achievement catalog", () => {
  it("has 25 achievements with 5 increasing tiers each", () => {
    expect(ACHIEVEMENT_IDS).toHaveLength(25);
    for (const id of ACHIEVEMENT_IDS) {
      const { thresholds } = ACHIEVEMENTS[id];
      thresholds
        .slice(1)
        .forEach((threshold, i) =>
          expect(threshold).toBeGreaterThan(thresholds[i]!),
        );
    }
  });

  it("counts tiers reached", () => {
    expect(tierFor("workouts", 0)).toBe(0);
    expect(tierFor("workouts", 1)).toBe(1);
    expect(tierFor("workouts", 49)).toBe(2);
    expect(tierFor("bench_king", 140)).toBe(5);
  });
});
