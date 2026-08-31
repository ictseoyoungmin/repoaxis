# JavaScript dogfood repository

`create-fixture.mjs` materializes a 20–50 file representative Git repository for end-to-end Repoaxis validation.

It intentionally contains:

- separate CLI and server entry paths;
- a shared bootstrap/config path suitable for `context` / `why` narrowing checks;
- one circular import pair;
- package-script and worker entry files that have no incoming repository import;
- service, repository, storage, HTTP, feature, telemetry, and utility layers;
- files that can be mutated into modified, staged, deleted, and untracked states during the test.

The fixture is not a runtime architecture example. Its purpose is to expose structural-navigation, Git-state, refresh, candidate-classification, annotation-durability, packaging, and human-viewer defects in one realistic-sized repository.
