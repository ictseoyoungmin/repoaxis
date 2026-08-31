import { isSupportedNodeType } from "./node-id.mjs";

const EDGE_TYPES = new Set(["contains", "imports"]);
const SYMBOL_TYPES = new Set(["class", "function"]);
const WORKING_STATES = new Set(["clean", "modified", "added", "deleted", "renamed", "copied", "type-changed", "untracked", "conflicted"]);
const STAGED_STATES = new Set(["modified", "added", "deleted", "renamed", "copied", "type-changed", "conflicted"]);
const MAX_AGENT_NOTE_CHARS = 8192;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validSourceRange(source) {
  if (!isObject(source)) return false;
  const ints = [source.start_line, source.start_column, source.end_line, source.end_column];
  if (!ints.every(Number.isInteger)) return false;
  if (source.start_line < 1 || source.end_line < 1 || source.start_column < 0 || source.end_column < 0) return false;
  if (source.end_line < source.start_line) return false;
  if (source.end_line === source.start_line && source.end_column < source.start_column) return false;
  return typeof source.signature === "string" && source.signature.length > 0;
}

function validLastCommit(commit) {
  if (commit === null) return true;
  if (!isObject(commit)) return false;
  if (typeof commit.sha !== "string" || !/^[0-9a-f]{40}$/.test(commit.sha)) return false;
  if (typeof commit.author_name !== "string") return false;
  if (typeof commit.authored_at !== "string" || !commit.authored_at) return false;
  if (typeof commit.committed_at !== "string" || !commit.committed_at) return false;
  if (typeof commit.subject !== "string") return false;
  return true;
}

function validGitState(state) {
  if (!isObject(state)) return false;
  if (typeof state.tracked !== "boolean" || typeof state.conflicted !== "boolean") return false;
  if (!WORKING_STATES.has(state.working)) return false;
  if (!(state.staged === false || STAGED_STATES.has(state.staged))) return false;
  if (state.rename_from != null && (typeof state.rename_from !== "string" || !state.rename_from)) return false;
  if (state.copy_from != null && (typeof state.copy_from !== "string" || !state.copy_from)) return false;
  if (state.similarity != null && (!Number.isInteger(state.similarity) || state.similarity < 0 || state.similarity > 100)) return false;
  if (state.conflict_code != null && (typeof state.conflict_code !== "string" || state.conflict_code.length !== 2)) return false;
  if (state.last_commit !== undefined && !validLastCommit(state.last_commit)) return false;
  return true;
}

function validAnnotation(annotation) {
  return isObject(annotation)
    && Object.keys(annotation).every((key) => key === "agent_note")
    && typeof annotation.agent_note === "string"
    && annotation.agent_note.trim().length > 0
    && annotation.agent_note.length <= MAX_AGENT_NOTE_CHARS;
}

export function validateIndex(index) {
  const errors = [];
  if (!isObject(index)) return { ok: false, errors: ["index must be an object"] };
  if (index.schema_version !== 1) errors.push("schema_version must be 1");
  if (!isObject(index.tool) || index.tool.name !== "repoaxis" || typeof index.tool.version !== "string") errors.push("tool must identify repoaxis and include a version");
  if (index.authority !== "git+working-tree") errors.push("authority must be git+working-tree");
  if (!isObject(index.repository) || index.repository.root !== ".") errors.push("repository.root must be '.'");
  if (!isObject(index.generated)) errors.push("generated must be an object");
  const nodes = index.generated?.nodes;
  const edges = index.generated?.edges;
  if (!isObject(nodes)) errors.push("generated.nodes must be an object");
  if (!Array.isArray(edges)) errors.push("generated.edges must be an array");
  if (index.generated?.git_changes != null && !Array.isArray(index.generated.git_changes)) errors.push("generated.git_changes must be an array when present");
  if (!isObject(index.generated?.refresh) || typeof index.generated.refresh.reason !== "string") errors.push("generated.refresh.reason must be a string");
  if (isObject(nodes)) {
    for (const [id, node] of Object.entries(nodes)) {
      if (!isObject(node)) { errors.push(`node ${id} must be an object`); continue; }
      if (node.id !== id) errors.push(`node ${id} must repeat its key in node.id`);
      if (!isSupportedNodeType(node.type)) errors.push(`node ${id} has unsupported type`);
      if (typeof node.path !== "string" || !node.path) errors.push(`node ${id} must include path`);
      if (node.git != null && !validGitState(node.git)) errors.push(`node ${id} has invalid git state`);
      if (SYMBOL_TYPES.has(node.type)) {
        if (typeof node.qualified_name !== "string" || !node.qualified_name) errors.push(`symbol ${id} must include qualified_name`);
        if (typeof node.parent_id !== "string" || !node.parent_id) errors.push(`symbol ${id} must include parent_id`);
        if (!validSourceRange(node.source)) errors.push(`symbol ${id} must include a valid source range and signature`);
      }
    }
    for (const [id, node] of Object.entries(nodes)) if (SYMBOL_TYPES.has(node.type) && !nodes[node.parent_id]) errors.push(`symbol ${id} references a missing parent_id`);
  }
  if (Array.isArray(index.generated?.git_changes)) {
    index.generated.git_changes.forEach((change, i) => {
      if (!isObject(change) || typeof change.path !== "string" || !change.path || !validGitState(change) || change.last_commit !== undefined) errors.push(`git change ${i} must include a path and valid working-tree git state`);
    });
  }
  if (Array.isArray(edges) && isObject(nodes)) {
    const seen = new Set();
    edges.forEach((edge, i) => {
      if (!isObject(edge) || !EDGE_TYPES.has(edge.type)) errors.push(`edge ${i} has unsupported type`);
      if (!nodes[edge?.from] || !nodes[edge?.to]) errors.push(`edge ${i} references a missing node`);
      const key = `${edge?.type}\0${edge?.from}\0${edge?.to}`;
      if (seen.has(key)) errors.push(`edge ${i} duplicates an existing edge`);
      seen.add(key);
    });
  }
  if (!isObject(index.annotations)) errors.push("annotations must be an object");
  else for (const [id, annotation] of Object.entries(index.annotations)) if (!validAnnotation(annotation)) errors.push(`annotation ${id} must contain one non-empty agent_note within ${MAX_AGENT_NOTE_CHARS} characters`);
  return { ok: errors.length === 0, errors };
}
