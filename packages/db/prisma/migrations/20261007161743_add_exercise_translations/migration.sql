-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('es', 'en');

-- CreateTable
CREATE TABLE "exercise_translations" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    -- ICU root collation: accent/case-aware alphabetical order in every locale
    -- (the default libc collation of postgres:alpine sorts "Á" after "Z").
    "name" TEXT COLLATE "und-x-icu" NOT NULL,

    CONSTRAINT "exercise_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercise_translations_locale_name_idx" ON "exercise_translations"("locale", "name");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_translations_exerciseId_locale_key" ON "exercise_translations"("exerciseId", "locale");

-- AddForeignKey
ALTER TABLE "exercise_translations" ADD CONSTRAINT "exercise_translations_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
