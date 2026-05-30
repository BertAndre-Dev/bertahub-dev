/** Origin for Socket.IO (same host as the REST API, without /api/v1). */
export function getSocketApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://bertahubdev.com";
  const trimmed = raw.replace(/\/$/, "");
  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).origin;
  } catch {
    return "https://bertahubdev.com";
  }
}
