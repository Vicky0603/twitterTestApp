import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import type { createAuthMiddleware } from "../services/auth.js";
import { updateProfileSchema } from "../services/auth.js";
import { serializeUser } from "../utils/auth-response.js";
import { serializeSocialUser } from "../utils/social.js";

type UsersRouterOptions = {
  prisma: PrismaClient;
  auth: ReturnType<typeof createAuthMiddleware>;
};

export function usersRouter({ prisma, auth }: UsersRouterOptions) {
  const router = Router();
  const searchUsersSchema = z.object({
    q: z.string().trim().max(50).default("")
  });

  function isUniqueConstraintError(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
  }

  function getUsernameParam(value: string | string[] | undefined) {
    const username = Array.isArray(value) ? value[0] : value;
    return username?.toLowerCase();
  }

  router.get("/discover", auth.requireAuth, async (request, response) => {
    const currentUserId = request.currentUser!.id;
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: currentUserId
        }
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true
          }
        },
        followers: {
          where: {
            followerId: currentUserId
          },
          select: {
            followerId: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    response.json({
      users: users.map((user) => serializeSocialUser(user, user.followers.length > 0))
    });
  });

  router.get("/search", auth.requireAuth, async (request, response) => {
    const query = searchUsersSchema.parse(request.query);
    const currentUserId = request.currentUser!.id;

    if (!query.q) {
      response.json({ users: [] });
      return;
    }

    const normalizedQuery = query.q.toLowerCase();
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: currentUserId
        },
        OR: [
          {
            username: {
              contains: normalizedQuery
            }
          },
          {
            displayName: {
              contains: query.q
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true
          }
        },
        followers: {
          where: {
            followerId: currentUserId
          },
          select: {
            followerId: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });

    response.json({
      users: users.map((user) => serializeSocialUser(user, user.followers.length > 0))
    });
  });

  router.get("/me/network", auth.requireAuth, async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.currentUser!.id },
      include: {
        followers: {
          include: {
            follower: {
              include: {
                _count: {
                  select: {
                    followers: true,
                    following: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        following: {
          include: {
            following: {
              include: {
                _count: {
                  select: {
                    followers: true,
                    following: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!user) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    response.json({
      followers: user.followers.map((entry) => serializeSocialUser(entry.follower)),
      following: user.following.map((entry) => serializeSocialUser(entry.following, true))
    });
  });

  router.post("/:username/follow", auth.requireAuth, async (request, response) => {
    const username = getUsernameParam(request.params.username);
    if (!username) {
      response.status(400).json({ message: "Username is required." });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    if (targetUser.id === request.currentUser!.id) {
      response.status(400).json({ message: "You cannot follow yourself." });
      return;
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: request.currentUser!.id,
          followingId: targetUser.id
        }
      },
      update: {},
      create: {
        followerId: request.currentUser!.id,
        followingId: targetUser.id
      }
    });

    const refreshedUser = await prisma.user.findUniqueOrThrow({
      where: { id: targetUser.id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    });

    response.json({ user: serializeSocialUser(refreshedUser, true) });
  });

  router.delete("/:username/follow", auth.requireAuth, async (request, response) => {
    const username = getUsernameParam(request.params.username);
    if (!username) {
      response.status(400).json({ message: "Username is required." });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: request.currentUser!.id,
        followingId: targetUser.id
      }
    });

    const refreshedUser = await prisma.user.findUniqueOrThrow({
      where: { id: targetUser.id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    });

    response.json({ user: serializeSocialUser(refreshedUser, false) });
  });

  router.get("/:username", auth.attachCurrentUser, async (request, response) => {
    const username = getUsernameParam(request.params.username);
    if (!username) {
      response.status(400).json({ message: "Username is required." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            followers: true,
            following: true
          }
        },
        followers: {
          include: {
            follower: true
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        following: {
          include: {
            following: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!user) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    const currentUserId = request.currentUser?.id;
    const isFollowing = currentUserId
      ? user.followers.some((entry) => entry.followerId === currentUserId)
      : false;

    response.json({
      user: {
        ...serializeUser(user),
        followersCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing,
        followers: user.followers.map((entry) => serializeSocialUser(entry.follower)),
        following: user.following.map((entry) => serializeSocialUser(entry.following, true))
      }
    });
  });

  router.patch("/me", auth.requireAuth, async (request, response) => {
    try {
      const input = updateProfileSchema.parse(request.body);
      const user = await prisma.user.update({
        where: { id: request.currentUser!.id },
        data: {
          username: input.username,
          displayName: input.displayName,
          bio: input.bio
        }
      });

      response.json({ user: serializeUser(user) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        response.status(409).json({ message: "Username is already taken." });
        return;
      }

      if (error instanceof Error && error.name === "ZodError") {
        response.status(400).json({ message: "Invalid profile payload." });
        return;
      }

      throw error;
    }
  });

  return router;
}
