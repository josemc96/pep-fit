import type { FastifyInstance } from "fastify";

export async function meRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/me",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const { clerkUserId } = request;

      const existingUser = await fastify.prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
      if (existingUser) {
        return reply.send(existingUser);
      }

      const clerkUser = await fastify.clerk.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses.find(
        (address) => address.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress;

      if (!email) {
        return reply.status(422).send({
          error: "InvalidUser",
          message: "Clerk user has no primary email address",
        });
      }

      const user = await fastify.prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          alias: clerkUser.username,
          avatarUrl: clerkUser.imageUrl,
        },
      });

      return reply.status(201).send(user);
    },
  );
}
