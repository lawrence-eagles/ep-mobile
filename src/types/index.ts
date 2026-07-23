export type Category = {
  id: string;
  name: string;
  slug: string;
  isFollowing: boolean;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  summary: string | null;
  createdAt: string;
  category: string | null;
  sourceName: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
};

export type FeedResponse = {
  items: Post[];
  nextCursor: string | null;
};
