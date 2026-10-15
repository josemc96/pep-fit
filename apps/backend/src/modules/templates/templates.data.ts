import type {
  Locale,
  TemplateEquipment,
  TemplateLevel,
} from "@pep-fit/shared-types";

/**
 * The routine catalog. Exercises are referenced by their canonical
 * free-exercise-db (English) name, which the exercise seed keeps stable;
 * a test checks every one exists. Weights are left blank on purpose: they
 * depend on the person, and "last time" hints fill the gap while training.
 * Rep ranges are stored as their midpoint (e.g. 8–12 → 10).
 */

type Localized = Record<Locale, string>;

export type TemplateExercise = {
  exercise: string;
  sets: number;
  reps: number;
  restSeconds: number;
};

export type TemplateDefinition = {
  id: string;
  name: Localized;
  description: Localized;
  level: TemplateLevel;
  equipment: TemplateEquipment;
  daysPerWeek: number;
  days: { name: Localized; exercises: TemplateExercise[] }[];
};

// Rest presets (seconds).
const HEAVY = 180;
const MAIN = 120;
const ACCESSORY = 90;
const LIGHT = 60;

const ex = (
  exercise: string,
  sets: number,
  reps: number,
  restSeconds = ACCESSORY,
): TemplateExercise => ({ exercise, sets, reps, restSeconds });

const day = (es: string, en: string, exercises: TemplateExercise[]) => ({
  name: { es, en },
  exercises,
});

// Shared days (PPL A is reused in the 6-day version).
const pushA = day("Empuje", "Push", [
  ex("Barbell Bench Press - Medium Grip", 4, 8, MAIN),
  ex("Incline Dumbbell Press", 3, 10),
  ex("Standing Military Press", 3, 8, MAIN),
  ex("Side Lateral Raise", 3, 12, LIGHT),
  ex("Triceps Pushdown", 3, 12, LIGHT),
]);
const pullA = day("Tirón", "Pull", [
  ex("Barbell Deadlift", 3, 5, HEAVY),
  ex("Pullups", 3, 8, MAIN),
  ex("Bent Over Barbell Row", 3, 8, MAIN),
  ex("Face Pull", 3, 15, LIGHT),
  ex("Barbell Curl", 3, 10, LIGHT),
  ex("Hammer Curls", 2, 12, LIGHT),
]);
const legsA = day("Pierna", "Legs", [
  ex("Barbell Squat", 4, 8, HEAVY),
  ex("Romanian Deadlift", 3, 10, MAIN),
  ex("Leg Press", 3, 12),
  ex("Lying Leg Curls", 3, 12, LIGHT),
  ex("Standing Calf Raises", 4, 15, LIGHT),
]);

export const ROUTINE_TEMPLATES: TemplateDefinition[] = [
  {
    id: "full-body-beginner",
    name: { es: "Full Body principiante", en: "Beginner full body" },
    description: {
      es: "Tres días de cuerpo completo con los básicos en el gimnasio. Ideal para empezar y aprender la técnica.",
      en: "Three full-body days built on the basic lifts. Ideal for starting out and learning technique.",
    },
    level: "beginner",
    equipment: "gym",
    daysPerWeek: 3,
    days: [
      day("Día A", "Day A", [
        ex("Barbell Squat", 3, 8, MAIN),
        ex("Barbell Bench Press - Medium Grip", 3, 8, MAIN),
        ex("Bent Over Barbell Row", 3, 8, MAIN),
        ex("Standing Military Press", 2, 10),
        ex("Crunches", 3, 15, LIGHT),
      ]),
      day("Día B", "Day B", [
        ex("Barbell Deadlift", 3, 5, HEAVY),
        ex("Incline Dumbbell Press", 3, 10),
        ex("Wide-Grip Lat Pulldown", 3, 10),
        ex("Dumbbell Lunges", 3, 10),
        ex("Hanging Leg Raise", 3, 10, LIGHT),
      ]),
      day("Día C", "Day C", [
        ex("Leg Press", 3, 12),
        ex("Dumbbell Bench Press", 3, 10),
        ex("Seated Cable Rows", 3, 10),
        ex("Side Lateral Raise", 3, 12, LIGHT),
        ex("Barbell Curl", 2, 12, LIGHT),
        ex("Triceps Pushdown", 2, 12, LIGHT),
      ]),
    ],
  },
  {
    id: "full-body-home",
    name: { es: "Full Body en casa", en: "Home full body" },
    description: {
      es: "Cuerpo completo sin material, solo con tu peso corporal. Para entrenar en casa o de viaje.",
      en: "Full body with no equipment, just your bodyweight. For training at home or while travelling.",
    },
    level: "beginner",
    equipment: "bodyweight",
    daysPerWeek: 3,
    days: [
      day("Día A", "Day A", [
        ex("Bodyweight Squat", 3, 15, LIGHT),
        ex("Pushups", 3, 10, LIGHT),
        ex("Inverted Row", 3, 10, LIGHT),
        ex("Bodyweight Walking Lunge", 3, 12, LIGHT),
        ex("Crunches", 3, 15, LIGHT),
      ]),
      day("Día B", "Day B", [
        ex("Split Squats", 3, 10, LIGHT),
        ex("Decline Push-Up", 3, 10, LIGHT),
        ex("Superman", 3, 12, LIGHT),
        ex("Butt Lift (Bridge)", 3, 15, LIGHT),
        ex("Mountain Climbers", 3, 20, LIGHT),
      ]),
      day("Día C", "Day C", [
        ex("Freehand Jump Squat", 3, 10, LIGHT),
        ex("Push-Ups - Close Triceps Position", 3, 10, LIGHT),
        ex("Bench Dips", 3, 12, LIGHT),
        ex("Single Leg Glute Bridge", 3, 10, LIGHT),
        ex("Reverse Crunch", 3, 12, LIGHT),
      ]),
    ],
  },
  {
    id: "full-body-dumbbells",
    name: { es: "Full Body con mancuernas", en: "Dumbbell full body" },
    description: {
      es: "Tres días de cuerpo completo solo con mancuernas. Perfecto para casa o gimnasios pequeños.",
      en: "Three full-body days using only dumbbells. Great for home or small gyms.",
    },
    level: "beginner",
    equipment: "dumbbells",
    daysPerWeek: 3,
    days: [
      day("Día A", "Day A", [
        ex("Goblet Squat", 3, 10),
        ex("Dumbbell Bench Press", 3, 10),
        ex("One-Arm Dumbbell Row", 3, 10),
        ex("Dumbbell Shoulder Press", 3, 10),
        ex("Hammer Curls", 2, 12, LIGHT),
      ]),
      day("Día B", "Day B", [
        ex("Stiff-Legged Dumbbell Deadlift", 3, 10),
        ex("Incline Dumbbell Press", 3, 10),
        ex("Bent Over Two-Dumbbell Row", 3, 10),
        ex("Dumbbell Lunges", 3, 10),
        ex("Side Lateral Raise", 3, 12, LIGHT),
      ]),
      day("Día C", "Day C", [
        ex("Dumbbell Squat", 3, 12),
        ex("Dumbbell Flyes", 3, 12, LIGHT),
        ex("Dumbbell Step Ups", 3, 10),
        ex("Dumbbell Shrug", 3, 12, LIGHT),
        ex("Standing Dumbbell Triceps Extension", 2, 12, LIGHT),
      ]),
    ],
  },
  {
    id: "strength-5x5",
    name: { es: "Fuerza 5×5", en: "Strength 5×5" },
    description: {
      es: "Dos entrenos (A y B) que se alternan tres días por semana con los grandes básicos a 5×5. Sube un poco el peso cada vez que completes todas las series.",
      en: "Two workouts (A and B) alternated three days a week, with the big lifts at 5×5. Add a little weight whenever you complete every set.",
    },
    level: "beginner",
    equipment: "gym",
    daysPerWeek: 3,
    days: [
      day("Entreno A", "Workout A", [
        ex("Barbell Squat", 5, 5, HEAVY),
        ex("Barbell Bench Press - Medium Grip", 5, 5, HEAVY),
        ex("Bent Over Barbell Row", 5, 5, HEAVY),
      ]),
      day("Entreno B", "Workout B", [
        ex("Barbell Squat", 5, 5, HEAVY),
        ex("Standing Military Press", 5, 5, HEAVY),
        ex("Barbell Deadlift", 1, 5, HEAVY),
      ]),
    ],
  },
  {
    id: "push-pull-legs",
    name: { es: "Push / Pull / Legs", en: "Push / Pull / Legs" },
    description: {
      es: "Empuje, tirón y pierna en tres días. Un clásico para ganar músculo y fuerza.",
      en: "Push, pull and legs over three days. A classic for building muscle and strength.",
    },
    level: "intermediate",
    equipment: "gym",
    daysPerWeek: 3,
    days: [pushA, pullA, legsA],
  },
  {
    id: "upper-lower",
    name: { es: "Torso / Pierna", en: "Upper / Lower" },
    description: {
      es: "Cuatro días alternando torso y pierna: uno más pesado y otro con más repeticiones de cada.",
      en: "Four days alternating upper and lower body: one heavier and one higher-rep day of each.",
    },
    level: "intermediate",
    equipment: "gym",
    daysPerWeek: 4,
    days: [
      day("Torso A", "Upper A", [
        ex("Barbell Bench Press - Medium Grip", 4, 6, MAIN),
        ex("Bent Over Barbell Row", 4, 6, MAIN),
        ex("Standing Military Press", 3, 8, MAIN),
        ex("Wide-Grip Lat Pulldown", 3, 10),
        ex("Barbell Curl", 2, 10, LIGHT),
        ex("Triceps Pushdown", 2, 10, LIGHT),
      ]),
      day("Pierna A", "Lower A", [
        ex("Barbell Squat", 4, 6, HEAVY),
        ex("Romanian Deadlift", 3, 8, MAIN),
        ex("Leg Press", 3, 10),
        ex("Lying Leg Curls", 3, 12, LIGHT),
        ex("Standing Calf Raises", 4, 12, LIGHT),
      ]),
      day("Torso B", "Upper B", [
        ex("Incline Dumbbell Press", 4, 10),
        ex("Seated Cable Rows", 4, 10),
        ex("Dumbbell Shoulder Press", 3, 10),
        ex("Pullups", 3, 8, MAIN),
        ex("Hammer Curls", 2, 12, LIGHT),
        ex("Standing Dumbbell Triceps Extension", 2, 12, LIGHT),
      ]),
      day("Pierna B", "Lower B", [
        ex("Barbell Deadlift", 3, 5, HEAVY),
        ex("Barbell Hip Thrust", 3, 10),
        ex("Dumbbell Lunges", 3, 10),
        ex("Leg Extensions", 3, 12, LIGHT),
        ex("Seated Calf Raise", 4, 15, LIGHT),
      ]),
    ],
  },
  {
    id: "weider-split",
    name: { es: "Weider clásica", en: "Classic bro split" },
    description: {
      es: "Un grupo muscular por día durante cinco días: pecho, espalda, pierna, hombro y brazo.",
      en: "One muscle group per day over five days: chest, back, legs, shoulders and arms.",
    },
    level: "intermediate",
    equipment: "gym",
    daysPerWeek: 5,
    days: [
      day("Pecho", "Chest", [
        ex("Barbell Bench Press - Medium Grip", 4, 8, MAIN),
        ex("Incline Dumbbell Press", 3, 10),
        ex("Dumbbell Flyes", 3, 12, LIGHT),
        ex("Cable Crossover", 3, 12, LIGHT),
        ex("Dips - Chest Version", 3, 10),
      ]),
      day("Espalda", "Back", [
        ex("Pullups", 4, 8, MAIN),
        ex("Bent Over Barbell Row", 4, 8, MAIN),
        ex("Wide-Grip Lat Pulldown", 3, 10),
        ex("Seated Cable Rows", 3, 10),
        ex("Hyperextensions (Back Extensions)", 3, 12, LIGHT),
      ]),
      day("Pierna", "Legs", [
        ex("Barbell Squat", 4, 8, HEAVY),
        ex("Leg Press", 3, 12),
        ex("Romanian Deadlift", 3, 10, MAIN),
        ex("Leg Extensions", 3, 12, LIGHT),
        ex("Lying Leg Curls", 3, 12, LIGHT),
        ex("Standing Calf Raises", 4, 15, LIGHT),
      ]),
      day("Hombro", "Shoulders", [
        ex("Standing Military Press", 4, 8, MAIN),
        ex("Side Lateral Raise", 3, 12, LIGHT),
        ex("Front Dumbbell Raise", 3, 12, LIGHT),
        ex("Reverse Flyes", 3, 12, LIGHT),
        ex("Dumbbell Shrug", 3, 12, LIGHT),
      ]),
      day("Brazo", "Arms", [
        ex("Barbell Curl", 4, 10),
        ex("Close-Grip Barbell Bench Press", 4, 8),
        ex("Hammer Curls", 3, 12, LIGHT),
        ex("Triceps Pushdown - Rope Attachment", 3, 12, LIGHT),
        ex("Concentration Curls", 2, 12, LIGHT),
        ex("Lying Triceps Press", 3, 10, LIGHT),
      ]),
    ],
  },
  {
    id: "push-pull-legs-6",
    name: { es: "Push / Pull / Legs ×2", en: "Push / Pull / Legs ×2" },
    description: {
      es: "Seis días: cada grupo dos veces por semana, una sesión más pesada (A) y otra con más volumen (B). Para quien ya tiene experiencia.",
      en: "Six days: every group twice a week, a heavier session (A) and a higher-volume one (B). For experienced lifters.",
    },
    level: "advanced",
    equipment: "gym",
    daysPerWeek: 6,
    days: [
      { ...pushA, name: { es: "Empuje A", en: "Push A" } },
      { ...pullA, name: { es: "Tirón A", en: "Pull A" } },
      { ...legsA, name: { es: "Pierna A", en: "Legs A" } },
      day("Empuje B", "Push B", [
        ex("Dumbbell Bench Press", 4, 10),
        ex("Barbell Incline Bench Press - Medium Grip", 3, 8, MAIN),
        ex("Dumbbell Shoulder Press", 3, 10),
        ex("Cable Crossover", 3, 12, LIGHT),
        ex("Side Lateral Raise", 3, 15, LIGHT),
        ex("Lying Triceps Press", 3, 10, LIGHT),
      ]),
      day("Tirón B", "Pull B", [
        ex("Wide-Grip Lat Pulldown", 4, 10),
        ex("One-Arm Dumbbell Row", 3, 10),
        ex("Seated Cable Rows", 3, 12),
        ex("Reverse Flyes", 3, 15, LIGHT),
        ex("Incline Dumbbell Curl", 3, 10, LIGHT),
        ex("Hammer Curls", 2, 12, LIGHT),
      ]),
      day("Pierna B", "Legs B", [
        ex("Front Barbell Squat", 4, 8, HEAVY),
        ex("Barbell Hip Thrust", 3, 10),
        ex("Dumbbell Lunges", 3, 12),
        ex("Leg Extensions", 3, 15, LIGHT),
        ex("Seated Leg Curl", 3, 12, LIGHT),
        ex("Seated Calf Raise", 4, 15, LIGHT),
      ]),
    ],
  },
  {
    id: "glutes-legs",
    name: { es: "Glúteo y pierna", en: "Glutes & legs" },
    description: {
      es: "Tres días centrados en glúteo y pierna. Puedes combinarlos con días de torso si quieres.",
      en: "Three days focused on glutes and legs. Combine them with upper-body days if you like.",
    },
    level: "all",
    equipment: "gym",
    daysPerWeek: 3,
    days: [
      day("Día 1", "Day 1", [
        ex("Barbell Hip Thrust", 4, 10, MAIN),
        ex("Barbell Squat", 4, 8, HEAVY),
        ex("Romanian Deadlift", 3, 10, MAIN),
        ex("Glute Kickback", 3, 12, LIGHT),
        ex("Thigh Abductor", 3, 15, LIGHT),
      ]),
      day("Día 2", "Day 2", [
        ex("Leg Press", 4, 12),
        ex("Dumbbell Lunges", 3, 10),
        ex("Lying Leg Curls", 3, 12, LIGHT),
        ex("Barbell Glute Bridge", 3, 12),
        ex("Standing Calf Raises", 4, 15, LIGHT),
      ]),
      day("Día 3", "Day 3", [
        ex("Sumo Deadlift", 3, 8, HEAVY),
        ex("Split Squat with Dumbbells", 3, 10),
        ex("Dumbbell Step Ups", 3, 10),
        ex("Single Leg Glute Bridge", 3, 12, LIGHT),
        ex("Thigh Adductor", 3, 15, LIGHT),
      ]),
    ],
  },
  {
    id: "express-30",
    name: { es: "Express 30 minutos", en: "30-minute express" },
    description: {
      es: "Dos entrenos cortos con descansos breves para cuando vas justo de tiempo. Lo esencial en media hora.",
      en: "Two short workouts with brief rests for when you're short on time. The essentials in half an hour.",
    },
    level: "all",
    equipment: "gym",
    daysPerWeek: 2,
    days: [
      day("Entreno A", "Workout A", [
        ex("Barbell Squat", 3, 8, LIGHT),
        ex("Barbell Bench Press - Medium Grip", 3, 8, LIGHT),
        ex("Bent Over Barbell Row", 3, 8, LIGHT),
      ]),
      day("Entreno B", "Workout B", [
        ex("Barbell Deadlift", 3, 5, LIGHT),
        ex("Standing Military Press", 3, 8, LIGHT),
        ex("Pullups", 3, 8, LIGHT),
      ]),
    ],
  },
];
