export function parseSlideToken(value: string): string | null {
  if (!value) return null;

  const match = value.match(/^\[SLIDE:(.+)\]$/);
  if (!match) return null;

  return match[1];
}

function normalizeLocalPath(filePath: string): string {
  if (!filePath) return "";

  if (filePath.startsWith("local-media://")) {
    return decodeURI(filePath.replace(/^local-media:\/\//, ""));
  }

  if (filePath.startsWith("file://")) {
    return decodeURI(filePath.replace(/^file:\/+/, "/"));
  }

  return filePath;
}

export function toFileUrl(filePath: string): string {
  if (!filePath) return "";
  if (filePath.startsWith("local-media://")) return filePath;

  const normalized = normalizeLocalPath(filePath).replace(/\\/g, "/");
  const pathname = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `local-media://${encodeURI(pathname)}`;
}

export function toLegacyFileUrl(filePath: string): string {
  if (!filePath) return "";
  if (filePath.startsWith("file://")) return filePath;

  const normalized = normalizeLocalPath(filePath).replace(/\\/g, "/");
  const pathname = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `file://${encodeURI(pathname)}`;
}
