import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { PrismaClient } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { tweetsRouter } from "./routes/tweets.js";
import { usersRouter } from "./routes/users.js";
import { createAuthMiddleware } from "./services/auth.js";

type CreateAppOptions = {
  prisma: PrismaClient;
};

export function createApp({ prisma }: CreateAppOptions) {
  const app = express();
  const auth = createAuthMiddleware(prisma);

  app.use(
    cors({
      origin: process.env.APP_ORIGIN ?? "http://localhost:5173",
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter({ prisma, auth }));
  app.use("/api/tweets", tweetsRouter({ prisma, auth }));
  app.use("/api/users", usersRouter({ prisma, auth }));

  return app;
}
