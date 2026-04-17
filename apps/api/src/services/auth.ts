import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { serializeUser } from "../utils/auth-response.js";

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(50),
  password: z.string().min(8).max(72)
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72)
});

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(50),
  bio: z.string().max(160)
});

type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: Date;
};

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "twitter_clone_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function shouldUseSecureCookies() {
  const configured = process.env.SESSION_COOKIE_SECURE;

  if (configured !== undefined) {
    return configured === "true";
  }

  return process.env.NODE_ENV === "production";
}

export type { AuthenticatedUser };
export { loginSchema, registerSchema, updateProfileSchema };

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: new Date(Date.now() + SESSION_TTL_MS)
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

async function createSession(prisma: PrismaClient, userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return { token, expiresAt };
}

function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/"
  });
}

async function resolveSession(prisma: PrismaClient, token?: string) {
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }

  return session;
}

export function createAuthMiddleware(prisma: PrismaClient) {
  async function attachCurrentUser(request: Request, _response: Response, next: NextFunction) {
    const token = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    request.sessionToken = token;

    const session = await resolveSession(prisma, token);
    if (session) {
      request.currentUser = session.user;
    }

    next();
  }

  async function requireAuth(request: Request, response: Response, next: NextFunction) {
    await attachCurrentUser(request, response, async () => {
      if (!request.currentUser) {
        response.status(401).json({ message: "Authentication required." });
        return;
      }

      next();
    });
  }

  return {
    attachCurrentUser,
    requireAuth,
    async register(response: Response, input: z.infer<typeof registerSchema>) {
      const parsed = registerSchema.parse(input);
      const passwordHash = await hashPassword(parsed.password);

      const user = await prisma.user.create({
        data: {
          email: parsed.email,
          username: parsed.username,
          displayName: parsed.displayName,
          passwordHash
        }
      });

      const session = await createSession(prisma, user.id);

      response.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions());
      return serializeUser(user);
    },
    async login(response: Response, input: z.infer<typeof loginSchema>) {
      const parsed = loginSchema.parse(input);
      const user = await prisma.user.findUnique({
        where: { email: parsed.email }
      });

      if (!user) {
        return null;
      }

      const passwordValid = await verifyPassword(parsed.password, user.passwordHash);
      if (!passwordValid) {
        return null;
      }

      const session = await createSession(prisma, user.id);

      response.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions());
      return serializeUser(user);
    },
    async logout(response: Response, token?: string) {
      if (token) {
        await prisma.session.deleteMany({
          where: { token }
        });
      }

      clearSessionCookie(response);
    },
    clearSessionCookie
  };
}
