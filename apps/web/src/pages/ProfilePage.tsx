import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createTweet, deleteTweet, getTimeline, type TimelineTweet } from "../auth/api";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tweetContent, setTweetContent] = useState("");
  const [tweetError, setTweetError] = useState<string | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [tweets, setTweets] = useState<TimelineTweet[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postingTweet, setPostingTweet] = useState(false);
  const [deletingTweetId, setDeletingTweetId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setDisplayName(user?.displayName ?? "");
    setBio(user?.bio ?? "");
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadInitialTimeline() {
      try {
        const response = await getTimeline();
        if (!active) {
          return;
        }

        setTweets(response.tweets);
        setNextCursor(response.pageInfo.nextCursor);
        setHasMore(response.pageInfo.hasMore);
        setTimelineError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setTimelineError(loadError instanceof Error ? loadError.message : "Could not load timeline.");
      } finally {
        if (active) {
          setLoadingTimeline(false);
        }
      }
    }

    void loadInitialTimeline();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasMore || !nextCursor || !loadMoreRef.current) {
      return;
    }

    const node = loadMoreRef.current;
    const observer = new IntersectionObserver((entries) => {
      const firstEntry = entries[0];
      if (firstEntry?.isIntersecting) {
        void handleLoadMore();
      }
    }, { rootMargin: "160px" });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, nextCursor, tweets.length]);

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

  async function handleCreateTweet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTweetError(null);
    setPostingTweet(true);

    try {
      const response = await createTweet({ content: tweetContent });
      setTweets((currentTweets) => [response.tweet, ...currentTweets]);
      setTweetContent("");
    } catch (submitError) {
      setTweetError(submitError instanceof Error ? submitError.message : "Could not publish tweet.");
    } finally {
      setPostingTweet(false);
    }
  }

  async function handleDeleteTweet(tweetId: string) {
    setTweetError(null);
    setDeletingTweetId(tweetId);

    try {
      await deleteTweet(tweetId);
      setTweets((currentTweets) => currentTweets.filter((tweet) => tweet.id !== tweetId));
    } catch (submitError) {
      setTweetError(submitError instanceof Error ? submitError.message : "Could not delete tweet.");
    } finally {
      setDeletingTweetId(null);
    }
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMoreRef.current) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const response = await getTimeline(nextCursor);
      setTweets((currentTweets) => [...currentTweets, ...response.tweets]);
      setNextCursor(response.pageInfo.nextCursor);
      setHasMore(response.pageInfo.hasMore);
      setTimelineError(null);
    } catch (loadError) {
      setTimelineError(loadError instanceof Error ? loadError.message : "Could not load more tweets.");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="dashboard-grid">
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

        <section className="panel timeline-panel">
          <div className="timeline-header">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>Latest from your network</h2>
            </div>
            <p className="timeline-caption">Tweets from the accounts you follow and your own posts.</p>
          </div>

          <form className="stack tweet-composer" onSubmit={handleCreateTweet}>
            <label className="field">
              <span>Create tweet</span>
              <textarea
                value={tweetContent}
                onChange={(event) => setTweetContent(event.target.value)}
                rows={4}
                maxLength={280}
                placeholder="What is happening?"
                required
              />
            </label>
            <div className="composer-footer">
              <span className="char-counter">{tweetContent.length}/280</span>
              <button className="primary-button" type="submit" disabled={postingTweet}>
                {postingTweet ? "Publishing..." : "Tweet"}
              </button>
            </div>
          </form>

          {tweetError ? <p className="form-error">{tweetError}</p> : null}
          {timelineError ? <p className="form-error">{timelineError}</p> : null}

          {loadingTimeline ? (
            <p className="body-copy">Loading timeline...</p>
          ) : tweets.length === 0 ? (
            <p className="body-copy">No tweets yet from your timeline. Follow users to populate it.</p>
          ) : (
            <div className="timeline-list">
              {tweets.map((tweet) => {
                const isOwner = tweet.author.id === user.id;

                return (
                  <article className="tweet-card" key={tweet.id}>
                    <div className="tweet-meta">
                      <div className="tweet-author">
                        <img
                          className="tweet-avatar"
                          src={tweet.author.avatarUrl ?? user.avatarUrl}
                          alt={`${tweet.author.username} avatar`}
                        />
                        <div>
                          <strong>{tweet.author.displayName}</strong>
                          <p className="tweet-handle">@{tweet.author.username}</p>
                        </div>
                      </div>
                      <time dateTime={tweet.createdAt}>
                        {new Date(tweet.createdAt).toLocaleString()}
                      </time>
                    </div>

                    <p className="tweet-content">{tweet.content}</p>

                    {isOwner ? (
                      <div className="tweet-actions">
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => void handleDeleteTweet(tweet.id)}
                          disabled={deletingTweetId === tweet.id}
                        >
                          {deletingTweetId === tweet.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          <div className="timeline-pagination">
            <div ref={loadMoreRef} />
            {hasMore ? (
              <button className="ghost-button" type="button" onClick={() => void handleLoadMore()} disabled={loadingMore}>
                {loadingMore ? "Loading more..." : "Load more"}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
