import { buildAvatarPlaceholder } from "./avatar.js";

type SocialUserRecord = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  _count?: {
    followers?: number;
    following?: number;
  };
};

export function serializeSocialUser(user: SocialUserRecord, isFollowing = false) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl ?? buildAvatarPlaceholder(user.username),
    followersCount: user._count?.followers ?? 0,
    followingCount: user._count?.following ?? 0,
    isFollowing
  };
}
