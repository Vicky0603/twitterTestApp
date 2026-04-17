import type { AuthenticatedUser } from "../services/auth.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthenticatedUser;
      sessionToken?: string | undefined;
    }
  }
}

export {};
