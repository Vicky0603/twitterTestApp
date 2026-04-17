import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app.js";
import { createTestPrisma } from "./helpers/test-db.js";

describe("authentication and profile flows", () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = await createTestPrisma(`auth-${crypto.randomUUID()}`);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("registers a user and creates a session cookie", async () => {
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("alice@example.com");
    expect(response.body.user.username).toBe("alice");
    expect(response.body.user.avatarUrl).toContain("dicebear");
    expect(response.headers["set-cookie"]).toBeTruthy();

    const sessions = await prisma.session.findMany();
    expect(sessions).toHaveLength(1);
  });

  it("rejects duplicate username or email on registration", async () => {
    const app = createApp({ prisma });

    await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const duplicate = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Again",
      password: "Passw0rd!"
    });

    expect(duplicate.status).toBe(409);
  });

  it("rejects invalid registration payloads", async () => {
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      username: "x",
      displayName: "A",
      password: "short"
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid registration payload.");
  });

  it("logs in an existing user and returns the current session", async () => {
    const app = createApp({ prisma });

    await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "Passw0rd!"
    });

    expect(login.status).toBe(200);
    expect(login.body.user.username).toBe("alice");

    const agent = request.agent(app);
    const cookie = login.headers["set-cookie"];

    const me = await agent.get("/api/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("alice@example.com");
  });

  it("rejects invalid credentials", async () => {
    const app = createApp({ prisma });

    await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "WrongPass1!"
    });

    expect(response.status).toBe(401);
  });

  it("rejects invalid login payloads", async () => {
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "short"
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid login payload.");
  });

  it("protects profile updates behind a valid session", async () => {
    const app = createApp({ prisma });

    const unauthorized = await request(app).patch("/api/users/me").send({
      username: "alice",
      displayName: "Alice Doe",
      bio: "new bio"
    });

    expect(unauthorized.status).toBe(401);

    const register = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const update = await request(app)
      .patch("/api/users/me")
      .set("Cookie", register.headers["set-cookie"])
      .send({
        username: "alice_new",
        displayName: "Alice Updated",
        bio: "building a twitter clone"
      });

    expect(update.status).toBe(200);
    expect(update.body.user.username).toBe("alice_new");
    expect(update.body.user.bio).toBe("building a twitter clone");
  });

  it("logs out and invalidates the active session", async () => {
    const app = createApp({ prisma });

    const register = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const cookie = register.headers["set-cookie"];

    const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logout.status).toBe(204);

    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(401);
  });

  it("requires an authenticated session to log out", async () => {
    const app = createApp({ prisma });

    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication required.");
  });

  it("clears the session cookie when the session user no longer exists", async () => {
    const app = createApp({ prisma });

    const register = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    await prisma.user.delete({
      where: { email: "alice@example.com" }
    });

    const me = await request(app).get("/api/auth/me").set("Cookie", register.headers["set-cookie"]);

    expect(me.status).toBe(401);
    expect(me.body.message).toBe("No active session.");
  });

  it("rejects expired sessions and removes them from the database", async () => {
    const app = createApp({ prisma });

    const user = await prisma.user.create({
      data: {
        email: "alice@example.com",
        username: "alice",
        displayName: "Alice Doe",
        passwordHash: "hash"
      }
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token: "expired-token",
        expiresAt: new Date("2020-01-01T00:00:00.000Z")
      }
    });

    const me = await request(app).get("/api/auth/me").set("Cookie", "twitter_clone_session=expired-token");

    expect(me.status).toBe(401);
    expect(me.body.message).toBe("No active session.");

    const deletedSession = await prisma.session.findUnique({
      where: { token: "expired-token" }
    });
    expect(deletedSession).toBeNull();
  });

  it("honors the secure cookie override when creating auth sessions", async () => {
    const previousValue = process.env.SESSION_COOKIE_SECURE;
    process.env.SESSION_COOKIE_SECURE = "true";

    try {
      const app = createApp({ prisma });

      const register = await request(app).post("/api/auth/register").send({
        email: "alice@example.com",
        username: "alice",
        displayName: "Alice Doe",
        password: "Passw0rd!"
      });

      expect(register.status).toBe(201);
      expect(register.headers["set-cookie"][0]).toContain("Secure");
    } finally {
      if (previousValue === undefined) {
        delete process.env.SESSION_COOKIE_SECURE;
      } else {
        process.env.SESSION_COOKIE_SECURE = previousValue;
      }
    }
  });

  it("returns public profile data by username", async () => {
    const app = createApp({ prisma });

    await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const profile = await request(app).get("/api/users/alice");
    expect(profile.status).toBe(200);
    expect(profile.body.user.displayName).toBe("Alice Doe");
  });
});
