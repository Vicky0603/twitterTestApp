import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";

const fetchMock = vi.fn();

describe("authentication UI", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("renders login by default when there is no active session", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "No active session." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    );

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("logs in and redirects to the protected profile screen", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "No active session." }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: "user_1",
              email: "alice@example.com",
              username: "alice",
              displayName: "Alice Doe",
              bio: "",
              avatarUrl: "https://example.com/avatar.svg"
            }
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        )
      );

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "Passw0rd!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /alice doe/i })).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login"),
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("creates a tweet from the timeline composer", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: "user_1",
              email: "alice@example.com",
              username: "alice",
              displayName: "Alice Doe",
              bio: "",
              avatarUrl: "https://example.com/alice.svg"
            }
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        )
      )
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
        new Response(
          JSON.stringify({
            tweet: {
              id: "tweet_1",
              content: "Timeline tweet",
              createdAt: "2026-04-16T10:00:00.000Z",
              updatedAt: "2026-04-16T10:00:00.000Z",
              author: {
                id: "user_1",
                username: "alice",
                displayName: "Alice Doe",
                avatarUrl: "https://example.com/alice.svg"
              }
            }
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" }
          }
        )
      );

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <App />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/create tweet/i), "Timeline tweet");
    await user.click(screen.getByRole("button", { name: /^tweet$/i }));

    expect(await screen.findByText("Timeline tweet")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/tweets"),
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });
});
