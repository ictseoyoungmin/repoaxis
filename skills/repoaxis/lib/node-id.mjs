const NODE_TYPES = new Set(["folder", "file", "class", "function"]);

export function normalizeRepoPath(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new TypeError("path must be a non-empty string");
  }
  const replaced = input.trim().replaceAll("\\", "/");
  const parts = [];
  for (const part of replaced.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!parts.length) throw new Error("path escapes repository root");
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join("/") || ".";
}

export function makeNodeId(type, path, qualifiedName = null) {
  if (!NODE_TYPES.has(type)) {
    throw new Error(`unsupported node type: ${type}`);
  }
  const normalizedPath = normalizeRepoPath(path);
  if (type === "folder" || type === "file") {
    if (qualifiedName != null && qualifiedName !== "") {
      throw new Error(`${type} node IDs do not accept a qualified name`);
    }
    return `${type}:${normalizedPath}`;
  }
  if (typeof qualifiedName !== "string" || qualifiedName.trim() === "") {
    throw new Error(`${type} node IDs require a qualified name`);
  }
  const qn = qualifiedName.trim().replace(/\s+/g, " ");
  return `${type}:${normalizedPath}::${qn}`;
}

export function isSupportedNodeType(type) {
  return NODE_TYPES.has(type);
}
