import type {
  Equipment,
  ExerciseCategory,
  MuscleGroup,
} from "@pep-fit/shared-types";

/**
 * Source-of-truth translations. Every other locale must match this shape
 * exactly (enforced through the `Translations` type).
 */
export const es = {
  common: {
    loading: "Cargando...",
    loadMore: "Cargar más",
    all: "Todos",
  },
  tabs: {
    dashboard: "Inicio",
    routines: "Rutinas",
    exercises: "Ejercicios",
    profile: "Perfil",
  },
  auth: {
    subtitle: "Inicia sesión para continuar",
    continueWithGoogle: "Continuar con Google",
    continueWithApple: "Continuar con Apple",
    emailPlaceholder: "Email",
    continueWithEmail: "Continuar con email",
    codePlaceholder: "Código recibido por email",
    verifyCode: "Verificar código",
    errors: {
      oauth: "No se pudo iniciar sesión: {{message}}",
      sendCode: "No se pudo enviar el código. Revisa el email.",
      invalidCode: "Código incorrecto. Inténtalo de nuevo.",
    },
  },
  dashboard: {
    title: "Inicio",
    description: "Aquí verás tu rutina activa, tu nivel y tu progreso.",
    startWorkout: "Empezar entrenamiento de hoy",
  },
  routines: {
    title: "Mis rutinas",
    description: "Aquí verás y gestionarás tus rutinas de entrenamiento.",
  },
  exercises: {
    title: "Ejercicios",
    anyEquipment: "Cualquier equipo",
    withWeight: "Con peso",
    withoutWeight: "Sin peso",
    loadError: "No se pudo cargar el catálogo de ejercicios.",
    empty: "Ningún ejercicio coincide con estos filtros.",
  },
  profile: {
    title: "Perfil",
    loadError: "No se pudo cargar tu perfil.",
    signOut: "Cerrar sesión",
    language: "Idioma",
    languageSystem: "Automático",
  },
  /** Each language is always shown in its own name, whatever the UI locale. */
  languageNames: {
    es: "Español",
    en: "English",
  },
  muscles: {
    abdominals: "Abdominales",
    abductors: "Abductores",
    adductors: "Aductores",
    biceps: "Bíceps",
    calves: "Gemelos",
    chest: "Pecho",
    forearms: "Antebrazos",
    glutes: "Glúteos",
    hamstrings: "Isquiotibiales",
    lats: "Dorsales",
    lower_back: "Lumbares",
    middle_back: "Espalda media",
    neck: "Cuello",
    quadriceps: "Cuádriceps",
    shoulders: "Hombros",
    traps: "Trapecios",
    triceps: "Tríceps",
  } satisfies Record<MuscleGroup, string>,
  equipment: {
    barbell: "Barra",
    dumbbell: "Mancuernas",
    kettlebells: "Kettlebells",
    machine: "Máquina",
    cable: "Polea",
    body_only: "Peso corporal",
    bands: "Bandas",
    medicine_ball: "Balón medicinal",
    exercise_ball: "Fitball",
    foam_roll: "Rodillo de espuma",
    e_z_curl_bar: "Barra Z",
    other: "Otro",
  } satisfies Record<Equipment, string>,
  categories: {
    strength: "Fuerza",
    stretching: "Estiramiento",
    plyometrics: "Pliometría",
    strongman: "Strongman",
    powerlifting: "Powerlifting",
    cardio: "Cardio",
    olympic_weightlifting: "Halterofilia",
  } satisfies Record<ExerciseCategory, string>,
};

type DeepStrings<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]>;
};

export type Translations = DeepStrings<typeof es>;
