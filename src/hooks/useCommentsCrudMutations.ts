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

      const res = await fetch(`${API_BASE_URL}/comments/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create comment");
      }

      return res.json().catch(() => undefined);
    },

    onSuccess: () => {
      setInput("");
      setReplyTo(null);

      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ================= DELETE =================

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`${API_BASE_URL}/comments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete comment");
      }

      return res.json().catch(() => undefined);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ================= UPDATE =================

  const updateMutation = useMutation<void, Error, UpdateCommentPayload>({
    mutationFn: async ({ id, content }) => {
      if (!content.trim()) {
        throw new Error("Content cannot be empty");
      }

      const res = await fetch(`${API_BASE_URL}/comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to update comment");
      }

      return res.json().catch(() => undefined);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    createMutation,
    deleteMutation,
    updateMutation,
  };
};
