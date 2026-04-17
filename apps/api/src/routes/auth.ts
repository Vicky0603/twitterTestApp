import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { createAuthMiddleware } from "../services/auth.js";
import { loginSchema, registerSchema } from "../services/auth.js";
import { serializeUser } from "../utils/auth-response.js";

type AuthRouterOptions = {
  prisma: PrismaClient;
  auth: ReturnType<typeof createAuthMiddleware>;
};

export function authRouter({ prisma, auth }: AuthRouterOptions) {
  const router = Router();

  function isUniqueConstraintError(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
  }

  router.post("/register", async (request, response) => {
    try {
      const user = await auth.register(response, registerSchema.parse(request.body));
      response.status(201).json({ user });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        response.status(409).json({ message: "Email or username is already taken." });
        return;
      }

      if (error instanceof Error && error.name === "ZodError") {
        response.status(400).json({ message: "Invalid registration payload." });
        return;
      }

      throw error;
    }
  });

  router.post("/login", async (request, response) => {
    try {
      const user = await auth.login(response, loginSchema.parse(request.body));

      if (!user) {
        response.status(401).json({ message: "Invalid email or password." });
        return;
      }

      response.json({ user });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        response.status(400).json({ message: "Invalid login payload." });
        return;
      }

      throw error;
    }
  });

  router.post("/logout", auth.requireAuth, async (request, response) => {
    await auth.logout(response, request.sessionToken);
    response.status(204).send();
  });

  router.get("/me", auth.attachCurrentUser, async (request, response) => {
    if (!request.currentUser) {
      response.status(401).json({ message: "No active session." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: request.currentUser.id }
    });

    if (!user) {
      auth.clearSessionCookie(response);
      response.status(401).json({ message: "No active session." });
      return;
    }

    response.json({ user: serializeUser(user) });
  });

  return router;
}
