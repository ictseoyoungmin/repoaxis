# S08 Annotations closure

## Scope

Add an explicit durable annotation read/write surface without changing canonical generated analysis.

## Closed behavior

- `repoaxis note TARGET TEXT...` sets/replaces one `agent_note` on a current unambiguous node.
- `repoaxis note TARGET` reads one annotation.
- `repoaxis notes` lists all annotations deterministically and marks missing-node entries as orphaned.
- `repoaxis note NODE_ID --clear` explicitly clears current or orphaned memory.
- Mutation validates the index, trims note input, rejects empty notes, bounds new note size, and atomically replaces the index file.
- Rebuild preserves existing annotations.
- Removing a source node does not silently delete its annotation.
- Schema version remains 1 and generated/annotation ownership remains unchanged.

## Verification

- Focused lifecycle prototype passed: set → read → orphan inspection → clear; missing targets rejected.
- Integration test added for actual Git repository build → note → rebuild preservation → source removal → orphan inspection → explicit clear.
- Integration test also covers CLI `note`/`notes`, empty/oversized note rejection, and absence of leftover temporary files after atomic mutation.

## Explicit non-goals

- No AI-generated summaries.
- No annotation inference or auto-writing.
- No automatic stale-note deletion.
- No rename-history migration or fingerprint-based note reattachment.
- No refresh/staleness automation.
