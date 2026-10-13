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
    loadError: "No se pudo cargar tu rutina.",
    noActiveRoutine:
      "Todavía no sigues ninguna rutina. Elige una en Rutinas para empezar a entrenar.",
    goToRoutines: "Ir a mis rutinas",
    chooseDay: "¿Qué día toca?",
    emptyDay: "Este día no tiene ejercicios. Añádelos editando la rutina.",
    startWorkout: "Empezar entrenamiento",
    inProgress: "Tienes un entrenamiento en curso",
    continueWorkout: "Continuar entrenamiento",
    workoutSaved: "¡Entrenamiento guardado!",
  },
  workout: {
    title: "Entrenamiento",
    noWorkout: "No hay ningún entrenamiento en curso.",
    goHome: "Volver al inicio",
    progress: "{{completed}}/{{total}} series",
    finish: "Terminar entrenamiento",
    finishing: "Guardando...",
    finishConfirm:
      "Hay series sin marcar y solo se guardarán las marcadas. ¿Terminar el entrenamiento?",
    finishLabel: "Terminar",
    discard: "Descartar entrenamiento",
    discardConfirm:
      "¿Descartar este entrenamiento? Se perderá todo lo que has apuntado.",
    discardLabel: "Descartar",
    nothingToSave:
      "Marca al menos una serie como hecha para poder guardar el entrenamiento.",
    saveFailed:
      "No se pudo guardar. Tu entrenamiento sigue aquí: vuelve a intentarlo cuando tengas conexión.",
    completeSet: "Marcar serie como hecha",
    rest: {
      title: "Descanso",
      done: "¡A por la siguiente serie!",
      addTime: "+15 s",
      skip: "Saltar",
    },
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
