import fs from "node:fs";

function cleanAnnotations(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const [nodeId, annotation] of Object.entries(value)) {
    if (!annotation || typeof annotation !== "object" || Array.isArray(annotation)) continue;
    if (typeof annotation.agent_note !== "string" || !annotation.agent_note.trim()) continue;
    output[nodeId] = { agent_note: annotation.agent_note.trim() };
  }
  return output;
}

export function readPreservedAnnotations(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return cleanAnnotations(parsed.annotations);
  } catch {
    return {};
  }
}

export function sanitizeAnnotations(value) {
  return cleanAnnotations(value);
}
