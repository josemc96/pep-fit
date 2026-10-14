-- CreateTable
CREATE TABLE "weekly_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_goals_userId_effectiveFrom_key" ON "weekly_goals"("userId", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

