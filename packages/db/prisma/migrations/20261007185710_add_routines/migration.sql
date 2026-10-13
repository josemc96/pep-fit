-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activeRoutineId" TEXT;

-- CreateTable
CREATE TABLE "routines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_days" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "routine_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_exercises" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "restSeconds" INTEGER NOT NULL,

    CONSTRAINT "routine_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_sets" (
    "id" TEXT NOT NULL,
    "routineExerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "targetReps" INTEGER,
    "targetWeightKg" DOUBLE PRECISION,

    CONSTRAINT "routine_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routines_userId_idx" ON "routines"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "routine_days_routineId_position_key" ON "routine_days"("routineId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "routine_exercises_dayId_position_key" ON "routine_exercises"("dayId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "routine_sets_routineExerciseId_position_key" ON "routine_sets"("routineExerciseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_activeRoutineId_key" ON "users"("activeRoutineId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_activeRoutineId_fkey" FOREIGN KEY ("activeRoutineId") REFERENCES "routines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_days" ADD CONSTRAINT "routine_days_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "routine_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_sets" ADD CONSTRAINT "routine_sets_routineExerciseId_fkey" FOREIGN KEY ("routineExerciseId") REFERENCES "routine_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

