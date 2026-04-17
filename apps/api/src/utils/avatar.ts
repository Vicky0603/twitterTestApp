export function buildAvatarPlaceholder(username: string) {
  const seed = encodeURIComponent(username.toLowerCase());
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
}
