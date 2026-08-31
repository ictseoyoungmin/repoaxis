export function createRefreshRecord(reason = "manual") {
  if (typeof reason !== "string" || !reason.trim()) {
    throw new TypeError("refresh reason must be a non-empty string");
  }
  return { reason: reason.trim() };
}
