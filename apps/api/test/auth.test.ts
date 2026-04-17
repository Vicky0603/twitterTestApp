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
