import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  createTweet,
  deleteTweet,
  followUser,
  getDiscoverUsers,
  getMyNetwork,
  getTimeline,
  likeTweet,
  searchUsers,
  type SocialUser,
  type TimelineTweet,
  unfollowUser,
  unlikeTweet
} from "../auth/api";

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
  const [likingTweetId, setLikingTweetId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [discoverUsers, setDiscoverUsers] = useState<SocialUser[]>([]);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SocialUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [followingUsername, setFollowingUsername] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setDisplayName(user?.displayName ?? "");
    setBio(user?.bio ?? "");
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [timelineResponse, networkResponse, discoverResponse] = await Promise.all([
          getTimeline(),
          getMyNetwork(),
          getDiscoverUsers()
        ]);
        if (!active) {
          return;
        }

        setTweets(timelineResponse.tweets);
        setNextCursor(timelineResponse.pageInfo.nextCursor);
        setHasMore(timelineResponse.pageInfo.hasMore);
        setFollowers(networkResponse.followers);
        setFollowing(networkResponse.following);
        setDiscoverUsers(discoverResponse.users);
        setTimelineError(null);
        setSocialError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Could not load dashboard.";
        setTimelineError(message);
        setSocialError(message);
      } finally {
        if (active) {
          setLoadingTimeline(false);
        }
      }
    }

    void loadDashboard();

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

  useEffect(() => {
    let active = true;
    const query = deferredSearchTerm.trim();

    async function runSearch() {
      if (!query) {
        setSearchResults([]);
        setSearchingUsers(false);
        return;
      }

      setSearchingUsers(true);

      try {
        const response = await searchUsers(query);
        if (!active) {
          return;
        }

        setSearchResults(response.users);
        setSocialError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setSocialError(loadError instanceof Error ? loadError.message : "Could not search users.");
      } finally {
        if (active) {
          setSearchingUsers(false);
        }
      }
    }

    void runSearch();

    return () => {
      active = false;
    };
  }, [deferredSearchTerm]);

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

  async function handleToggleFollow(profile: SocialUser) {
    setSocialError(null);
    setFollowingUsername(profile.username);

    try {
      const [response, timelineResponse] = await Promise.all([
        profile.isFollowing ? unfollowUser(profile.username) : followUser(profile.username),
        getTimeline()
      ]);
      const updatedUser = response.user;
      setTweets(timelineResponse.tweets);
      setNextCursor(timelineResponse.pageInfo.nextCursor);
      setHasMore(timelineResponse.pageInfo.hasMore);

      setDiscoverUsers((currentUsers) =>
        currentUsers.map((candidate) =>
          candidate.id === updatedUser.id
            ? {
                ...candidate,
                ...updatedUser
              }
            : candidate
        )
      );
      setSearchResults((currentResults) =>
        currentResults.map((candidate) =>
          candidate.id === updatedUser.id
            ? {
                ...candidate,
                ...updatedUser
              }
            : candidate
        )
      );
      setFollowers((currentFollowers) =>
        currentFollowers.map((entry) =>
          entry.id === updatedUser.id
            ? {
                ...entry,
                isFollowing: updatedUser.isFollowing,
                followersCount: updatedUser.followersCount,
                followingCount: updatedUser.followingCount
              }
            : entry
        )
      );

      if (profile.isFollowing) {
        setFollowing((currentFollowing) => currentFollowing.filter((entry) => entry.id !== updatedUser.id));
      } else {
        setFollowing((currentFollowing) => {
          const exists = currentFollowing.some((entry) => entry.id === updatedUser.id);
          return exists ? currentFollowing : [{ ...updatedUser, isFollowing: true }, ...currentFollowing];
        });
      }
    } catch (submitError) {
      setSocialError(submitError instanceof Error ? submitError.message : "Could not update follow status.");
    } finally {
      setFollowingUsername(null);
    }
  }

  async function handleToggleLike(tweet: TimelineTweet) {
    setTweetError(null);
    setLikingTweetId(tweet.id);

    try {
      const response = tweet.likedByMe ? await unlikeTweet(tweet.id) : await likeTweet(tweet.id);
      setTweets((currentTweets) =>
        currentTweets.map((entry) => (entry.id === tweet.id ? response.tweet : entry))
      );
    } catch (submitError) {
      setTweetError(submitError instanceof Error ? submitError.message : "Could not update like.");
    } finally {
      setLikingTweetId(null);
    }
  }

  return (
    <main className="app-shell">
      <div className="dashboard-grid">
        <div className="sidebar-stack">
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

          <section className="panel social-panel">
            <p className="eyebrow">Network</p>
            <div className="network-grid">
              <div>
                <h3>Following</h3>
                <p className="network-count">{following.length}</p>
                <div className="social-list">
                  {following.length === 0 ? <p className="body-copy">You are not following anyone yet.</p> : null}
                  {following.map((entry) => (
                    <article className="social-card" key={`following-${entry.id}`}>
                      <div>
                        <strong>{entry.displayName}</strong>
                        <p className="tweet-handle">@{entry.username}</p>
                      </div>
                      <button
                        className="ghost-button"
                        type="button"
                        disabled={followingUsername === entry.username}
                        onClick={() => void handleToggleFollow(entry)}
                      >
                        {followingUsername === entry.username ? "Working..." : "Unfollow"}
                      </button>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <h3>Followers</h3>
                <p className="network-count">{followers.length}</p>
                <div className="social-list">
                  {followers.length === 0 ? <p className="body-copy">No followers yet.</p> : null}
                  {followers.map((entry) => (
                    <article className="social-card" key={`follower-${entry.id}`}>
                      <div>
                        <strong>{entry.displayName}</strong>
                        <p className="tweet-handle">@{entry.username}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

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
          {socialError ? <p className="form-error">{socialError}</p> : null}

          <section className="discover-panel">
            <div className="discover-header">
              <h3>Search users</h3>
              <p className="timeline-caption">Search by display name or username.</p>
            </div>
            <label className="field">
              <span>Search</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Try alice or Alice Doe"
              />
            </label>
            {searchTerm.trim() ? (
              <div className="social-list">
                {searchingUsers ? <p className="body-copy">Searching users...</p> : null}
                {!searchingUsers && searchResults.length === 0 ? (
                  <p className="body-copy">No users match that search.</p>
                ) : null}
                {searchResults.map((candidate) => (
                  <article className="social-card" key={`search-${candidate.id}`}>
                    <div>
                      <strong>{candidate.displayName}</strong>
                      <p className="tweet-handle">@{candidate.username}</p>
                      <p className="social-meta">
                        {candidate.followersCount} followers · {candidate.followingCount} following
                      </p>
                    </div>
                    <button
                      className={candidate.isFollowing ? "ghost-button" : "primary-button"}
                      type="button"
                      disabled={followingUsername === candidate.username}
                      onClick={() => void handleToggleFollow(candidate)}
                    >
                      {followingUsername === candidate.username
                        ? "Working..."
                        : candidate.isFollowing
                          ? "Unfollow"
                          : "Follow"}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="discover-panel">
            <div className="discover-header">
              <h3>Discover people</h3>
              <p className="timeline-caption">Follow users to populate your timeline.</p>
            </div>
            <div className="social-list">
              {discoverUsers.length === 0 ? <p className="body-copy">No suggestions available.</p> : null}
              {discoverUsers.map((candidate) => (
                <article className="social-card" key={candidate.id}>
                  <div>
                    <strong>{candidate.displayName}</strong>
                    <p className="tweet-handle">@{candidate.username}</p>
                    <p className="social-meta">
                      {candidate.followersCount} followers · {candidate.followingCount} following
                    </p>
                  </div>
                  <button
                    className={candidate.isFollowing ? "ghost-button" : "primary-button"}
                    type="button"
                    disabled={followingUsername === candidate.username}
                    onClick={() => void handleToggleFollow(candidate)}
                  >
                    {followingUsername === candidate.username
                      ? "Working..."
                      : candidate.isFollowing
                        ? "Unfollow"
                        : "Follow"}
                  </button>
                </article>
              ))}
            </div>
          </section>

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

                    <div className="tweet-actions">
                      <button
                        className={tweet.likedByMe ? "primary-button" : "ghost-button"}
                        type="button"
                        onClick={() => void handleToggleLike(tweet)}
                        disabled={likingTweetId === tweet.id}
                      >
                        {likingTweetId === tweet.id
                          ? "Working..."
                          : tweet.likedByMe
                            ? `Unlike · ${tweet.likesCount}`
                            : `Like · ${tweet.likesCount}`}
                      </button>

                    {isOwner ? (
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => void handleDeleteTweet(tweet.id)}
                          disabled={deletingTweetId === tweet.id}
                        >
                          {deletingTweetId === tweet.id ? "Deleting..." : "Delete"}
                        </button>
                    ) : null}
                    </div>
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
