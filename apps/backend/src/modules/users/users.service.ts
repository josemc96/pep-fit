import type { User } from "@pep-fit/db";
import type { FastifyInstance } from "fastify";

export class InvalidUserError extends Error {
  readonly statusCode = 422;
  override readonly name = "InvalidUser";
}

/**
 * Returns the local user for a Clerk id, creating it from the Clerk profile
 * on first sight (users are provisioned lazily, there is no signup webhook).
 */
export async function findOrCreateUser(
  fastify: FastifyInstance,
  clerkUserId: string,
): Promise<{ user: User; created: boolean }> {
  const existingUser = await fastify.prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });
  if (existingUser) {
    return { user: existingUser, created: false };
  }

  const clerkUser = await fastify.clerk.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  if (!email) {
    throw new InvalidUserError("Clerk user has no primary email address");
  }

  const user = await fastify.prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email,
      alias: clerkUser.username,
      avatarUrl: clerkUser.imageUrl,
    },
  });

  return { user, created: true };
}
