import fs from "node:fs";
import path from "node:path";
import {
  readDurableAnnotations,
  repositoryRootForDefaultIndex,
  writeDurableAnnotations,
} from "./annotation-store.mjs";
import { resolveNode } from "./query.mjs";
import { validateIndex } from "./schema.mjs";
import { stableStringify } from "./stable-json.mjs";

export const MAX_AGENT_NOTE_CHARS = 8192;

function cleanAnnotations(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const [nodeId, annotation] of Object.entries(value)) {
    if (!annotation || typeof annotation !== "object" || Array.isArray(annotation)) continue;
    if (typeof annotation.agent_note !== "string") continue;
    const note = annotation.agent_note.trim();
    if (!note) continue;
    output[nodeId] = { agent_note: note };
  }
  return output;
}

function readIndexAnnotations(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return cleanAnnotations(parsed.annotations);
  } catch {
    return {};
  }
}

export function readPreservedAnnotations(filePath) {
  const legacy = readIndexAnnotations(filePath);
  const root = repositoryRootForDefaultIndex(filePath);
  if (!root) return legacy;

  const durable = cleanAnnotations(readDurableAnnotations(root));
  const merged = cleanAnnotations({ ...legacy, ...durable });
  if (stableStringify(durable) !== stableStringify(merged)) {
    writeDurableAnnotations(root, merged);
  }
  return merged;
}

export function sanitizeAnnotations(value) {
  return cleanAnnotations(value);
}

function normalizeNote(note) {
  if (typeof note !== "string") throw new Error("annotation note must be a string");
  const value = note.trim();
  if (!value) throw new Error("annotation note must not be empty");
  if (value.length > MAX_AGENT_NOTE_CHARS) {
    throw new Error(`annotation note must be at most ${MAX_AGENT_NOTE_CHARS} characters`);
  }
  return value;
}

export function readAnnotationIndex(filePath) {
  const absolute = path.resolve(filePath);
  const index = JSON.parse(fs.readFileSync(absolute, "utf8"));
  const validation = validateIndex(index);
  if (!validation.ok) throw new Error(`invalid index: ${validation.errors.join("; ")}`);

  const root = repositoryRootForDefaultIndex(absolute);
  if (root) {
    const durable = cleanAnnotations(readDurableAnnotations(root));
    index.annotations = cleanAnnotations({ ...index.annotations, ...durable });
  }
  return { file: absolute, index };
}

function resolveAnnotationTarget(index, target, { allowOrphan = false } = {}) {
  const value = typeof target === "string" ? target.trim() : "";
  if (allowOrphan && value && index?.annotations?.[value] && !index?.generated?.nodes?.[value]) {
    return { id: value, orphaned: true };
  }
  try {
    return { id: resolveNode(index, target).id, orphaned: false };
  } catch (error) {
    if (allowOrphan && value && index?.annotations?.[value]) {
      return { id: value, orphaned: !index?.generated?.nodes?.[value] };
    }
    throw error;
  }
}

export function annotationFor(index, target) {
  const resolved = resolveAnnotationTarget(index, target, { allowOrphan: true });
  return {
    target_id: resolved.id,
    orphaned: resolved.orphaned,
    annotation: index.annotations?.[resolved.id] ?? null,
  };
}

export function listAnnotations(index) {
  const nodes = index?.generated?.nodes ?? {};
  return Object.entries(index?.annotations ?? {})
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([id, annotation]) => ({
      target_id: id,
      orphaned: !nodes[id],
      annotation,
    }));
}

function writeIndexAtomic(filePath, index) {
  const directory = path.dirname(filePath);
  const temp = path.join(directory, `.${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}`);
  const mode = fs.statSync(filePath).mode;
  try {
    fs.writeFileSync(temp, stableStringify(index), { encoding: "utf8", mode });
    fs.renameSync(temp, filePath);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function persistDefaultRepositoryAnnotations(filePath, annotations) {
  const root = repositoryRootForDefaultIndex(filePath);
  if (root) writeDurableAnnotations(root, cleanAnnotations(annotations));
}

export function setAnnotation(filePath, target, note) {
  const { file, index } = readAnnotationIndex(filePath);
  const resolved = resolveAnnotationTarget(index, target);
  const agentNote = normalizeNote(note);
  index.annotations[resolved.id] = { agent_note: agentNote };
  persistDefaultRepositoryAnnotations(file, index.annotations);
  writeIndexAtomic(file, index);
  return { target_id: resolved.id, orphaned: false, annotation: index.annotations[resolved.id] };
}

export function clearAnnotation(filePath, target) {
  const { file, index } = readAnnotationIndex(filePath);
  const resolved = resolveAnnotationTarget(index, target, { allowOrphan: true });
  const existed = Boolean(index.annotations[resolved.id]);
  delete index.annotations[resolved.id];
  persistDefaultRepositoryAnnotations(file, index.annotations);
  writeIndexAtomic(file, index);
  return { target_id: resolved.id, orphaned: resolved.orphaned, cleared: existed };
}
