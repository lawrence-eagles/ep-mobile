import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ================= TYPES =================

interface CreateCommentPayload {
  content: string;
  parentId?: string | null;
}

interface UpdateCommentPayload {
  id: string;
  content: string;
}

// ================= HELPERS =================

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let message = "Something went wrong";

    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      const text = await res.text().catch(() => "");
      if (text) message = text;
    }

    throw new Error(message);
  }

  return res.json().catch(() => undefined);
};

// ================= HOOK =================

export const useCommentsCrudMutations = ({
  postId,
  input,
  replyTo,
  setInput,
  setReplyTo,
}: {
  postId: string;
  input: string;
  replyTo: string | null;
  setInput: (value: string) => void;
  setReplyTo: (value: string | null) => void;
}) => {
  const cookies = authClient.getCookie();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const queryClient = useQueryClient();
  const queryKey = ["comments", postId];

  // ================= CREATE =================

  const createMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!input.trim()) {
        throw new Error("Comment cannot be empty");
      }

      const payload: CreateCommentPayload = {
        content: input.trim(),
        parentId: replyTo ?? null,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/comments/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
        body: JSON.stringify(payload),
      });

      await handleResponse(res);
    },

    onSuccess: () => {
      setInput("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey });
    },

    onError: (error) => {
      console.error("Create comment failed:", error.message);
    },
  });

  // ================= DELETE =================

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/comments/${id}`, {
        method: "DELETE",
        headers: {
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
      });

      await handleResponse(res);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },

    onError: (error) => {
      console.error("Delete comment failed:", error.message);
    },
  });

  // ================= UPDATE =================

  const updateMutation = useMutation<void, Error, UpdateCommentPayload>({
    mutationFn: async ({ id, content }) => {
      if (!content.trim()) {
        throw new Error("Content cannot be empty");
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
        body: JSON.stringify({ content: content.trim() }),
      });

      await handleResponse(res);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },

    onError: (error) => {
      console.error("Update comment failed:", error.message);
    },
  });

  return {
    createMutation,
    deleteMutation,
    updateMutation,
  };
};
