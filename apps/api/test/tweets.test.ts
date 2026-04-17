import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app.js";
import { createTestPrisma } from "./helpers/test-db.js";

describe("tweet flows", () => {
  let prisma: PrismaClient | undefined;

  beforeEach(async () => {
    prisma = await createTestPrisma(`tweets-${crypto.randomUUID()}`);
  });

  afterEach(async () => {
    await prisma?.$disconnect();
  });

  it("creates a tweet for the authenticated user", async () => {
    const app = createApp({ prisma });
    const register = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const response = await request(app)
      .post("/api/tweets")
      .set("Cookie", register.headers["set-cookie"])
      .send({
        content: "Launching tweet support."
      });

    expect(response.status).toBe(201);
    expect(response.body.tweet.content).toBe("Launching tweet support.");
    expect(response.body.tweet.author.username).toBe("alice");

    const tweets = await prisma.tweet.findMany();
    expect(tweets).toHaveLength(1);
  });

  it("rejects tweets longer than 280 characters", async () => {
    const app = createApp({ prisma });
    const register = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const response = await request(app)
      .post("/api/tweets")
      .set("Cookie", register.headers["set-cookie"])
      .send({
        content: "x".repeat(281)
      });

    expect(response.status).toBe(400);
  });

  it("deletes only the authenticated user's own tweet", async () => {
    const app = createApp({ prisma });
    const alice = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });
    const bob = await request(app).post("/api/auth/register").send({
      email: "bob@example.com",
      username: "bob",
      displayName: "Bob Doe",
      password: "Passw0rd!"
    });
    const aliceUser = await prisma.user.findUniqueOrThrow({ where: { username: "alice" } });

    const tweet = await prisma.tweet.create({
      data: {
        content: "Keep this safe.",
        authorId: aliceUser.id
      }
    });

    const forbidden = await request(app)
      .delete(`/api/tweets/${tweet.id}`)
      .set("Cookie", bob.headers["set-cookie"]);
    expect(forbidden.status).toBe(403);

    const deleted = await request(app)
      .delete(`/api/tweets/${tweet.id}`)
      .set("Cookie", alice.headers["set-cookie"]);
    expect(deleted.status).toBe(204);

    const remaining = await prisma.tweet.findMany();
    expect(remaining).toHaveLength(0);
  });

  it("returns a reverse chronological timeline for followed users with pagination", async () => {
    const app = createApp({ prisma });
    const aliceRegister = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });
    await request(app).post("/api/auth/register").send({
      email: "bob@example.com",
      username: "bob",
      displayName: "Bob Doe",
      password: "Passw0rd!"
    });
    await request(app).post("/api/auth/register").send({
      email: "carol@example.com",
      username: "carol",
      displayName: "Carol Doe",
      password: "Passw0rd!"
    });

    const alice = await prisma.user.findUniqueOrThrow({ where: { username: "alice" } });
    const bob = await prisma.user.findUniqueOrThrow({ where: { username: "bob" } });
    const carol = await prisma.user.findUniqueOrThrow({ where: { username: "carol" } });

    await prisma.follow.create({
      data: {
        followerId: alice.id,
        followingId: bob.id
      }
    });

    const aliceTweet = await prisma.tweet.create({
      data: {
        content: "Alice tweet",
        authorId: alice.id,
        createdAt: new Date("2026-04-16T10:02:00.000Z")
      }
    });
    const newestBobTweet = await prisma.tweet.create({
      data: {
        content: "Bob newest",
        authorId: bob.id,
        createdAt: new Date("2026-04-16T10:03:00.000Z")
      }
    });
    await prisma.tweet.create({
      data: {
        content: "Carol should be hidden",
        authorId: carol.id,
        createdAt: new Date("2026-04-16T10:04:00.000Z")
      }
    });
    const olderBobTweet = await prisma.tweet.create({
      data: {
        content: "Bob older",
        authorId: bob.id,
        createdAt: new Date("2026-04-16T10:01:00.000Z")
      }
    });

    const firstPage = await request(app)
      .get("/api/tweets/timeline?limit=2")
      .set("Cookie", aliceRegister.headers["set-cookie"]);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.tweets).toHaveLength(2);
    expect(firstPage.body.tweets.map((tweet: { content: string }) => tweet.content)).toEqual([
      newestBobTweet.content,
      aliceTweet.content
    ]);
    expect(firstPage.body.pageInfo.hasMore).toBe(true);

    const secondPage = await request(app)
      .get(`/api/tweets/timeline?limit=2&cursor=${firstPage.body.pageInfo.nextCursor}`)
      .set("Cookie", aliceRegister.headers["set-cookie"]);

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.tweets.map((tweet: { content: string }) => tweet.content)).toEqual([
      olderBobTweet.content
    ]);
    expect(secondPage.body.pageInfo.hasMore).toBe(false);
  });
});
