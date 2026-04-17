type TweetWithAuthor = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likes?: Array<{ userId: string }>;
  _count?: {
    likes?: number;
  };
};

export function serializeTweet(tweet: TweetWithAuthor) {
  return {
    id: tweet.id,
    content: tweet.content,
    createdAt: tweet.createdAt.toISOString(),
    updatedAt: tweet.updatedAt.toISOString(),
    author: {
      id: tweet.author.id,
      username: tweet.author.username,
      displayName: tweet.author.displayName,
      avatarUrl: tweet.author.avatarUrl
    },
    likesCount: tweet._count?.likes ?? 0,
    likedByMe: (tweet.likes?.length ?? 0) > 0
  };
}
