import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  createTweet,
  deleteTweet,
  followUser,
  getDiscoverUsers,
  getMyNetwork,
  getTimeline,
  likeTweet,
  searchUsers,
  unfollowUser
} from "../auth/api";

const fetchMock = vi.fn();

describe("web api client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  it("sends JSON requests with credentials included", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { username: "alice" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const response = await apiRequest<{ user: { username: string } }>("/api/auth/login", {
      method: "POST",
      body: {
        email: "alice@example.com",
        password: "Passw0rd!"
      }
    });

    expect(response.user.username).toBe("alice");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email: "alice@example.com",
          password: "Passw0rd!"
        })
      })
    );
  });

  it("returns null for 204 responses", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 204
      })
    );

    await expect(
      apiRequest("/api/auth/logout", {
        method: "POST"
      })
    ).resolves.toBeNull();
  });

  it("throws the API message for non-ok responses", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "No active session." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    );

    await expect(apiRequest("/api/auth/me")).rejects.toThrow("No active session.");
  });

  it("falls back to a generic error message when the response is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("upstream failure", {
        status: 502
      })
    );

    await expect(apiRequest("/api/auth/me")).rejects.toThrow("Request failed.");
  });

  it("builds the expected timeline and social routes", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            tweets: [],
            pageInfo: {
              nextCursor: null,
              hasMore: false
            }
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ tweet: { id: "tweet_1" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ users: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { username: "bob" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { username: "bob" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ users: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ followers: [], following: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ tweet: { id: "tweet_1" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 204
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ tweet: { id: "tweet_1" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );

    await getTimeline();
    await getTimeline("cursor_123");
    await createTweet({ content: "Timeline tweet" });
    await searchUsers("bob");
    await followUser("bob");
    await unfollowUser("bob");
    await getDiscoverUsers();
    await getMyNetwork();
    await likeTweet("tweet_1");
    await deleteTweet("tweet_1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:4000/api/tweets/timeline",
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:4000/api/tweets/timeline?cursor=cursor_123",
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:4000/api/tweets",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:4000/api/users/search?q=bob",
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      "http://localhost:4000/api/users/bob/follow",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      "http://localhost:4000/api/users/bob/follow",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      "http://localhost:4000/api/users/discover",
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      8,
      "http://localhost:4000/api/users/me/network",
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      9,
      "http://localhost:4000/api/tweets/tweet_1/like",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      10,
      "http://localhost:4000/api/tweets/tweet_1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
