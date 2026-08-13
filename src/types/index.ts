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

export type EmptyUIProps = {
  isLoading?: boolean;
};

export type Reply = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likesCount: number;
  isLiked: boolean;
  userImage: string;
  userName: string;
};

export type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likesCount: number;
  userImage: string;
  userName: string;
  isLiked: boolean;
  replies: Reply[];
  repliesNextCursor: string | null;
  repliesHasMore: boolean;
};

export type commentFeedResponse = {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
};

// ============================================================
// PROFILE TYPES
// ============================================================

export type ProfileUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type SessionData = {
  user?: ProfileUser | null;
};

export type ImageKitUploadResponse = {
  url?: string;
  filePath?: string;
  name?: string;
};

export type ImageKitUploadError = {
  message?: string;
};

export type ImageKitClient = {
  upload: (
    options: {
      file: string;
      fileName: string;
      token?: string;
      expire?: number;
      signature?: string;
      folder?: string;
      useUniqueFileName?: boolean;
      responseFields?: string[];
    },
    callback: (
      error: ImageKitUploadError | null,
      result?: ImageKitUploadResponse,
    ) => void,
  ) => void;
};
