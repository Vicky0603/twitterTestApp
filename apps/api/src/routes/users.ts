import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { createAuthMiddleware } from "../services/auth.js";
import { updateProfileSchema } from "../services/auth.js";
import { serializeUser } from "../utils/auth-response.js";

type UsersRouterOptions = {
  prisma: PrismaClient;
  auth: ReturnType<typeof createAuthMiddleware>;
};

export function usersRouter({ prisma, auth }: UsersRouterOptions) {
  const router = Router();

  function isUniqueConstraintError(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
  }

  router.get("/:username", async (request, response) => {
    const username = request.params.username.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    response.json({ user: serializeUser(user) });
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
