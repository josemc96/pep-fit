// Stand-in for @clerk/backend in integration tests. The bearer token *is* the
// Clerk user id, so a test can act as any user without talking to Clerk:
//   vi.mock("@clerk/backend", () => import("./support/clerk-mock.js"));

export const verifyToken = async (token: string) => ({ sub: token });

export const createClerkClient = () => ({
  users: {
    getUser: async (id: string) => ({
      id,
      username: null,
      imageUrl: "https://example.com/avatar.png",
      primaryEmailAddressId: "email_1",
      emailAddresses: [{ id: "email_1", emailAddress: `${id}@example.com` }],
    }),
  },
});
