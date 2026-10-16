import { describe, expect, it } from "vitest";

import { loadEnv } from "../config/env.js";

describe("loadEnv", () => {
  it("parses valid env vars and applies defaults", () => {
    const env = loadEnv({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      CLERK_SECRET_KEY: "sk_test_xxx",
    });
    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe("development");
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => loadEnv({ CLERK_SECRET_KEY: "sk_test_xxx" })).toThrow();
  });

  it("throws when CLERK_SECRET_KEY is missing", () => {
    expect(() =>
      loadEnv({ DATABASE_URL: "postgresql://user:pass@localhost:5432/db" }),
    ).toThrow();
  });

  it("reads storage flags as real booleans and leaves storage optional", () => {
    const base = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      CLERK_SECRET_KEY: "sk_test_xxx",
    };
    expect(loadEnv(base).S3_ENDPOINT).toBeUndefined();
    expect(loadEnv(base)).toMatchObject({
      S3_REGION: "auto",
      S3_FORCE_PATH_STYLE: false,
      S3_AUTO_SETUP: false,
    });
    expect(
      loadEnv({ ...base, S3_FORCE_PATH_STYLE: "false", S3_AUTO_SETUP: "true" }),
    ).toMatchObject({ S3_FORCE_PATH_STYLE: false, S3_AUTO_SETUP: true });
  });
});
