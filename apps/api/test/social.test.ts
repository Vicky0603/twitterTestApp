import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app.js";
import { createTestPrisma } from "./helpers/test-db.js";

describe("social flows", () => {
  let prisma: PrismaClient | undefined;

  beforeEach(async () => {
    prisma = await createTestPrisma(`social-${crypto.randomUUID()}`);
  });

  afterEach(async () => {
    await prisma?.$disconnect();
  });

  it("follows and unfollows another user, exposing discover and network data", async () => {
    const app = createApp({ prisma });
    const alice = await request(app).post("/api/auth/register").send({
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

    const discoverBefore = await request(app)
      .get("/api/users/discover")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(discoverBefore.status).toBe(200);
    expect(discoverBefore.body.users[0].username).toBe("bob");
    expect(discoverBefore.body.users[0].isFollowing).toBe(false);

    const follow = await request(app)
      .post("/api/users/bob/follow")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(follow.status).toBe(200);
    expect(follow.body.user.username).toBe("bob");
    expect(follow.body.user.isFollowing).toBe(true);
    expect(follow.body.user.followersCount).toBe(1);

    const network = await request(app)
      .get("/api/users/me/network")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(network.status).toBe(200);
    expect(network.body.following).toHaveLength(1);
    expect(network.body.following[0].username).toBe("bob");

    const unfollow = await request(app)
      .delete("/api/users/bob/follow")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(unfollow.status).toBe(200);
    expect(unfollow.body.user.isFollowing).toBe(false);
    expect(unfollow.body.user.followersCount).toBe(0);
  });

  it("rejects following yourself", async () => {
    const app = createApp({ prisma });
    const alice = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });

    const response = await request(app)
      .post("/api/users/alice/follow")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(response.status).toBe(400);
  });

  it("likes and unlikes tweets while exposing the visible like count", async () => {
    const app = createApp({ prisma });
    const alice = await request(app).post("/api/auth/register").send({
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

    const bob = await prisma.user.findUniqueOrThrow({ where: { username: "bob" } });
    await prisma.follow.create({
      data: {
        followerId: (await prisma.user.findUniqueOrThrow({ where: { username: "alice" } })).id,
        followingId: bob.id
      }
    });
    const tweet = await prisma.tweet.create({
      data: {
        content: "Please like this",
        authorId: bob.id
      }
    });

    const like = await request(app)
      .post(`/api/tweets/${tweet.id}/like`)
      .set("Cookie", alice.headers["set-cookie"]);

    expect(like.status).toBe(200);
    expect(like.body.tweet.likesCount).toBe(1);
    expect(like.body.tweet.likedByMe).toBe(true);

    const timeline = await request(app)
      .get("/api/tweets/timeline")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(timeline.status).toBe(200);
    expect(timeline.body.tweets).toHaveLength(1);
    expect(timeline.body.tweets[0].likesCount).toBe(1);
    expect(timeline.body.tweets[0].likedByMe).toBe(true);

    const unlike = await request(app)
      .delete(`/api/tweets/${tweet.id}/like`)
      .set("Cookie", alice.headers["set-cookie"]);

    expect(unlike.status).toBe(200);
    expect(unlike.body.tweet.likesCount).toBe(0);
    expect(unlike.body.tweet.likedByMe).toBe(false);
  });

  it("returns followers and following lists on the public profile payload", async () => {
    const app = createApp({ prisma });
    const alice = await request(app).post("/api/auth/register").send({
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

    const aliceUser = await prisma.user.findUniqueOrThrow({ where: { username: "alice" } });
    const bobUser = await prisma.user.findUniqueOrThrow({ where: { username: "bob" } });
    const carolUser = await prisma.user.findUniqueOrThrow({ where: { username: "carol" } });

    await prisma.follow.create({
      data: {
        followerId: aliceUser.id,
        followingId: bobUser.id
      }
    });
    await prisma.follow.create({
      data: {
        followerId: carolUser.id,
        followingId: bobUser.id
      }
    });

    const profile = await request(app)
      .get("/api/users/bob")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(profile.status).toBe(200);
    expect(profile.body.user.followersCount).toBe(2);
    expect(profile.body.user.followingCount).toBe(0);
    expect(profile.body.user.isFollowing).toBe(true);
    expect(profile.body.user.followers.map((entry: { username: string }) => entry.username)).toEqual(
      expect.arrayContaining(["alice", "carol"])
    );
    expect(profile.body.user.following).toEqual([]);
  });

  it("searches users by display name or username", async () => {
    const app = createApp({ prisma });
    const alice = await request(app).post("/api/auth/register").send({
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice Doe",
      password: "Passw0rd!"
    });
    await request(app).post("/api/auth/register").send({
      email: "bobby@example.com",
      username: "bobby_tables",
      displayName: "Bob Tables",
      password: "Passw0rd!"
    });
    await request(app).post("/api/auth/register").send({
      email: "carol@example.com",
      username: "carol",
      displayName: "Carol Example",
      password: "Passw0rd!"
    });

    const byUsername = await request(app)
      .get("/api/users/search?q=bobby")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(byUsername.status).toBe(200);
    expect(byUsername.body.users).toHaveLength(1);
    expect(byUsername.body.users[0].username).toBe("bobby_tables");

    const byDisplayName = await request(app)
      .get("/api/users/search?q=Bob")
      .set("Cookie", alice.headers["set-cookie"]);

    expect(byDisplayName.status).toBe(200);
    expect(byDisplayName.body.users).toHaveLength(1);
    expect(byDisplayName.body.users[0].displayName).toBe("Bob Tables");
  });
});
