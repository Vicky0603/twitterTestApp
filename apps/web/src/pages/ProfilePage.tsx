import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setDisplayName(user?.displayName ?? "");
    setBio(user?.bio ?? "");
  }, [user]);

  if (!user) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      await updateProfile({ username, displayName, bio });
      setMessage("Profile updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not update profile.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <main className="app-shell">
      <section className="panel profile-panel">
        <div className="profile-header">
          <img className="avatar" src={user.avatarUrl} alt={`${user.username} avatar`} />
          <div>
            <p className="eyebrow">Your profile</p>
            <h1>{user.displayName}</h1>
            <p className="body-copy">@{user.username}</p>
          </div>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Display name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </label>

          <label className="field">
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>

          <label className="field">
            <span>Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              maxLength={160}
            />
          </label>

          {message ? <p className="form-success">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          <div className="button-row">
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save profile"}
            </button>
            <button className="ghost-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
