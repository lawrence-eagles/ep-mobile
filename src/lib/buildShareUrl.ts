// ================= SOCIAL SHARE =================

export function buildShareUrl(
  channel: string,
  url: string,
  title: string,
): string | null {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;

    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    default:
      return null;
  }
}
