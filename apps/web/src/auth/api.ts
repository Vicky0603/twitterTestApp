const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const requestInit: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  };

  if (options.method !== undefined) {
    requestInit.method = options.method;
  }

  if (options.mode !== undefined) {
    requestInit.mode = options.mode;
  }

  if (options.cache !== undefined) {
    requestInit.cache = options.cache;
  }

  if (options.redirect !== undefined) {
    requestInit.redirect = options.redirect;
  }

  if (options.referrer !== undefined) {
    requestInit.referrer = options.referrer;
  }

  if (options.referrerPolicy !== undefined) {
    requestInit.referrerPolicy = options.referrerPolicy;
  }

  if (options.integrity !== undefined) {
    requestInit.integrity = options.integrity;
  }

  if (options.keepalive !== undefined) {
    requestInit.keepalive = options.keepalive;
  }

  if (options.signal !== undefined) {
    requestInit.signal = options.signal;
  }

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${path}`, requestInit);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Request failed.");
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export type TimelineAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type TimelineTweet = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: TimelineAuthor;
  likesCount: number;
  likedByMe: boolean;
};

export type TimelineResponse = {
  tweets: TimelineTweet[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type SocialUser = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
};

export type NetworkResponse = {
  followers: SocialUser[];
  following: SocialUser[];
};

export function getTimeline(cursor?: string | null) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest<TimelineResponse>(`/api/tweets/timeline${query}`);
}

export function createTweet(input: { content: string }) {
  return apiRequest<{ tweet: TimelineTweet }>("/api/tweets", {
    method: "POST",
    body: input
  });
}

export function deleteTweet(tweetId: string) {
  return apiRequest<null>(`/api/tweets/${tweetId}`, {
    method: "DELETE"
  });
}

export function likeTweet(tweetId: string) {
  return apiRequest<{ tweet: TimelineTweet }>(`/api/tweets/${tweetId}/like`, {
    method: "POST"
  });
}

export function unlikeTweet(tweetId: string) {
  return apiRequest<{ tweet: TimelineTweet }>(`/api/tweets/${tweetId}/like`, {
    method: "DELETE"
  });
}

export function getDiscoverUsers() {
  return apiRequest<{ users: SocialUser[] }>("/api/users/discover");
}

export function getMyNetwork() {
  return apiRequest<NetworkResponse>("/api/users/me/network");
}

export function followUser(username: string) {
  return apiRequest<{ user: SocialUser }>(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: "POST"
  });
}

export function unfollowUser(username: string) {
  return apiRequest<{ user: SocialUser }>(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: "DELETE"
  });
}
