import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import type { createAuthMiddleware } from "../services/auth.js";
import { serializeTweet } from "../utils/tweets.js";

type TweetsRouterOptions = {
  prisma: PrismaClient;
  auth: ReturnType<typeof createAuthMiddleware>;
};

type FollowingRecord = {
  followingId: string;
};

type TimelineTweetRecord = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

const createTweetSchema = z.object({
  content: z.string().trim().min(1).max(280)
});

const timelineQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10)
});

export function tweetsRouter({ prisma, auth }: TweetsRouterOptions) {
  const router = Router();

  router.post("/", auth.requireAuth, async (request, response) => {
    try {
      const input = createTweetSchema.parse(request.body);

      const tweet = await prisma.tweet.create({
        data: {
          content: input.content,
          authorId: request.currentUser!.id
        },
        include: {
          author: true
        }
      });

      response.status(201).json({ tweet: serializeTweet(tweet) });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        response.status(400).json({ message: "Tweet content must be between 1 and 280 characters." });
        return;
      }

      throw error;
    }
  });

  router.get("/timeline", auth.requireAuth, async (request, response) => {
    try {
      const query = timelineQuerySchema.parse(request.query);
      const following = await prisma.follow.findMany({
        where: { followerId: request.currentUser!.id },
        select: { followingId: true }
      });

      const authorIds = [request.currentUser!.id, ...following.map((entry: FollowingRecord) => entry.followingId)];

      let cursorFilter = {};
      if (query.cursor) {
        const cursorTweet = await prisma.tweet.findUnique({
          where: { id: query.cursor },
          select: { id: true, createdAt: true }
        });

        if (cursorTweet) {
          cursorFilter = {
            OR: [
              { createdAt: { lt: cursorTweet.createdAt } },
              {
                createdAt: cursorTweet.createdAt,
                id: { lt: cursorTweet.id }
              }
            ]
          };
        }
      }

      const tweets = await prisma.tweet.findMany({
        where: {
          authorId: { in: authorIds },
          ...cursorFilter
        },
        include: {
          author: true
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: query.limit + 1
      });

      const hasMore = tweets.length > query.limit;
      const items = hasMore ? tweets.slice(0, query.limit) : tweets;
      const nextCursor = hasMore ? items.at(-1)?.id ?? null : null;

      response.json({
        tweets: items.map((tweet: TimelineTweetRecord) => serializeTweet(tweet)),
        pageInfo: {
          nextCursor,
          hasMore
        }
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        response.status(400).json({ message: "Invalid timeline query." });
        return;
      }

      throw error;
    }
  });

  router.delete("/:tweetId", auth.requireAuth, async (request, response) => {
    const tweet = await prisma.tweet.findUnique({
      where: { id: request.params.tweetId },
      select: { id: true, authorId: true }
    });

    if (!tweet) {
      response.status(404).json({ message: "Tweet not found." });
      return;
    }

    if (tweet.authorId !== request.currentUser!.id) {
      response.status(403).json({ message: "You can only delete your own tweets." });
      return;
    }

    await prisma.tweet.delete({
      where: { id: tweet.id }
    });

    response.status(204).send();
  });

  return router;
}
