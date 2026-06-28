export const ensureSafeUrl = (url: string | undefined | null): string => {
  if (!url) return "#";
  const lowerUrl = url.toLowerCase().trim();
  if (lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("data:text/html") || lowerUrl.startsWith("vbscript:")) {
    return "#";
  }
  return url;
};
