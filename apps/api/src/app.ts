import cors from "cors";
import express from "express";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.APP_ORIGIN ?? "http://localhost:5173",
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  return app;
}
