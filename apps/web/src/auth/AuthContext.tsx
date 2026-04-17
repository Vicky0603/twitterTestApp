import { createContext, startTransition, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: {
    username: string;
    displayName: string;
    bio: string;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const response = await apiRequest<{ user: AuthUser }>("/api/auth/me");
        if (!active) {
          return;
        }

        startTransition(() => {
          setUser(response.user);
        });
      } catch {
        if (!active) {
          return;
        }

        startTransition(() => {
          setUser(null);
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function login(input: { email: string; password: string }) {
    const response = await apiRequest<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: input
    });

    startTransition(() => {
      setUser(response.user);
    });
  }

  async function register(input: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) {
    const response = await apiRequest<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: input
    });

    startTransition(() => {
      setUser(response.user);
    });
  }

  async function logout() {
    await apiRequest("/api/auth/logout", {
      method: "POST"
    });

    startTransition(() => {
      setUser(null);
    });
  }

  async function updateProfile(input: {
    username: string;
    displayName: string;
    bio: string;
  }) {
    const response = await apiRequest<{ user: AuthUser }>("/api/users/me", {
      method: "PATCH",
      body: input
    });

    startTransition(() => {
      setUser(response.user);
    });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
