import type { Prisma } from "@pep-fit/db";

export class UnknownExerciseError extends Error {
  readonly statusCode = 400;
  override readonly name = "UnknownExercise";
}

/** Fails with a 400 (instead of an FK error) if any exercise id is unknown. */
export async function assertExercisesExist(
  prisma: Prisma.TransactionClient,
  exerciseIds: Iterable<string>,
) {
  const ids = new Set(exerciseIds);
  if (ids.size === 0) return;

  const found = await prisma.exercise.count({
    where: { id: { in: [...ids] } },
  });
  if (found !== ids.size) {
    throw new UnknownExerciseError("One or more exercises do not exist");
  }
}
