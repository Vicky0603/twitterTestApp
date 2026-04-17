import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="app-shell">
        <section className="panel">
          <p className="eyebrow">Loading</p>
          <h1>Checking your session...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <ProfilePage />;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<AuthGate />} />
      </Routes>
    </AuthProvider>
  );
}
