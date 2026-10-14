import { prisma } from "@pep-fit/db";

/**
 * Integration tests run against the local Postgres; suites skip cleanly when
 * it isn't reachable (e.g. a machine without Docker).
 */
export const dbAvailable = await prisma.$queryRaw`SELECT 1`.then(
  () => true,
  () => {
    console.warn(
      "\n⚠ Postgres is not reachable: database integration tests are SKIPPED." +
        "\n  Start it with `docker compose up -d postgres` to run them.\n",
    );
    return false;
  },
);

/** Deletes every user (and, by cascade, their data) created by a suite. */
export function deleteTestUsers(clerkIdPrefix: string) {
  return prisma.user.deleteMany({
    where: { clerkId: { startsWith: clerkIdPrefix } },
  });
}

export const authAs = (clerkUserId: string) => ({
  authorization: `Bearer ${clerkUserId}`,
});
