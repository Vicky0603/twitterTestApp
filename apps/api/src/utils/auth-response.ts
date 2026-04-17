import { buildAvatarPlaceholder } from "./avatar.js";

type SerializableUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: Date;
};

export function serializeUser(user: SerializableUser) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl ?? buildAvatarPlaceholder(user.username),
    createdAt: user.createdAt.toISOString()
  };
}
