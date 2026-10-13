-- AlterTable
-- Existing rows get an empty value; the exercise seed (re-runnable upsert)
-- fills it in with the normalized name.
ALTER TABLE "exercise_translations" ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "exercise_translations" ALTER COLUMN "searchName" DROP DEFAULT;
