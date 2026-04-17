import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

export async function createTestPrisma(name: string) {
  const directory = path.resolve("apps/api/prisma/test-dbs");
  await fs.mkdir(directory, { recursive: true });

  const filePath = path.join(directory, `${name}.db`);
  await fs.rm(filePath, { force: true });

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${filePath}`
      }
    }
  });

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "username" TEXT NOT NULL,
      "displayName" TEXT NOT NULL,
      "bio" TEXT NOT NULL DEFAULT '',
      "avatarUrl" TEXT,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_username_key" ON "User"("username");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Tweet" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "content" TEXT NOT NULL,
      "imageUrl" TEXT,
      "authorId" TEXT NOT NULL,
      "parentId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Tweet_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Tweet_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tweet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX "Tweet_authorId_createdAt_idx" ON "Tweet"("authorId", "createdAt" DESC);`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Follow" (
      "followerId" TEXT NOT NULL,
      "followingId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("followerId", "followingId"),
      CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Like" (
      "userId" TEXT NOT NULL,
      "tweetId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("userId", "tweetId"),
      CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Like_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX "Session_userId_idx" ON "Session"("userId");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "tweetId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  return prisma;
}
