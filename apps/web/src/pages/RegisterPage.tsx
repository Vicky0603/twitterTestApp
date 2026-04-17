import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/profile" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register({ email, username, displayName, password });
      navigate("/profile");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="panel auth-panel">
        <p className="eyebrow">Register</p>
        <h1>Create your account.</h1>
        <p className="body-copy">Start with email, password and a unique username.</p>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Victoria Doe"
              required
            />
          </label>

          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="victoria"
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="body-copy footer-copy">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
