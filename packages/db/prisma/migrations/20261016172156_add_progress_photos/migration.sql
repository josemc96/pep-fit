-- CreateEnum
CREATE TYPE "PhotoPose" AS ENUM ('front', 'side', 'back', 'other');

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "takenOn" DATE NOT NULL,
    "pose" "PhotoPose" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "progress_photos_storageKey_key" ON "progress_photos"("storageKey");

-- CreateIndex
CREATE INDEX "progress_photos_userId_takenOn_idx" ON "progress_photos"("userId", "takenOn");

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

