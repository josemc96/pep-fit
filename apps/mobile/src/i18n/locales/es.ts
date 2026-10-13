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
    cancel: "Cancelar",
    moveUp: "Subir",
    moveDown: "Bajar",
    remove: "Quitar",
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
    new: "Nueva rutina",
    empty: "Aún no tienes rutinas. Crea la primera para empezar.",
    loadError: "No se pudieron cargar tus rutinas.",
    dayCount_one: "{{count}} día",
    dayCount_other: "{{count}} días",
    activeBadge: "Activa",
  },
  routineEditor: {
    newTitle: "Nueva rutina",
    editTitle: "Editar rutina",
    namePlaceholder: "Nombre de la rutina (p. ej. Torso / Pierna)",
    dayNamePlaceholder: "Nombre del día",
    defaultDayName: "Día {{number}}",
    addDay: "+ Añadir día",
    addExercise: "+ Añadir ejercicio",
    noExercises: "Todavía no hay ejercicios en este día.",
    restSeconds: "Descanso (s)",
    save: "Guardar",
    saving: "Guardando...",
    saved: "Rutina guardada",
    activate: "Seguir esta rutina",
    deactivate: "Dejar de seguir esta rutina",
    activeNotice: "Es tu rutina activa",
    delete: "Eliminar rutina",
    deleteConfirm:
      "¿Seguro que quieres eliminar esta rutina? No se puede deshacer.",
    removeDayConfirm: "¿Quitar este día y sus ejercicios?",
    errors: {
      invalid: "Revisa la rutina: necesita un nombre y cada día también.",
      saveFailed: "No se pudo guardar la rutina. Inténtalo de nuevo.",
      loadFailed: "No se pudo cargar la rutina.",
      actionFailed: "No se pudo completar la acción. Inténtalo de nuevo.",
    },
  },
  sets: {
    set: "Serie",
    reps: "Reps",
    weight: "Kg",
    addSet: "+ Añadir serie",
    removeSet: "Quitar serie",
  },
  exercisePicker: {
    title: "Añadir ejercicios",
    add_one: "Añadir {{count}} ejercicio",
    add_other: "Añadir {{count}} ejercicios",
  },
  exercises: {
    title: "Ejercicios",
    searchPlaceholder: "Buscar por nombre",
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
