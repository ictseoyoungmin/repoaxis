import fs from "node:fs";
import path from "node:path";

export const DOGFOOD_FILES = {
  ".gitignore": ".repoaxis.json\nnode_modules/\n",
  "package.json": JSON.stringify({
    name: "repoaxis-dogfood-app",
    private: true,
    type: "module",
    scripts: {
      cli: "node src/cli.js",
      server: "node src/server.js",
      migrate: "node scripts/migrate.js",
      seed: "node scripts/seed.js",
      nightly: "node src/workers/nightly.js"
    }
  }, null, 2) + "\n",
  "src/cli.js": "import { bootstrap } from './app/bootstrap.js';\nimport { createReport } from './services/report-service.js';\nexport async function runCli(argv = process.argv.slice(2)) { const app = await bootstrap('cli'); return createReport(app, argv[0] ?? 'daily'); }\nif (import.meta.url === `file://${process.argv[1]}`) runCli();\n",
  "src/server.js": "import { bootstrap } from './app/bootstrap.js';\nimport { createRouter } from './http/router.js';\nexport async function startServer() { const app = await bootstrap('server'); return createRouter(app); }\n",
  "src/app/bootstrap.js": "import { loadConfig } from '../config/load.js';\nimport { createContext } from './context.js';\nimport { warmCycle } from '../cycle/a.js';\nimport { logger } from '../utils/logger.js';\nexport async function bootstrap(mode) { const config = loadConfig(process.env); warmCycle(); logger('bootstrap', mode); return createContext({ mode, config }); }\n",
  "src/app/context.js": "import { createUserService } from '../services/user-service.js';\nimport { createAuditService } from '../services/audit-service.js';\nexport function createContext(base) { return { ...base, users: createUserService(base), audit: createAuditService(base) }; }\n",
  "src/config/load.js": "import { defaults } from './defaults.js';\nimport { readEnv } from './env.js';\nimport { parseConfig } from './parse.js';\nexport function loadConfig(env) { return parseConfig({ ...defaults, ...readEnv(env) }); }\n",
  "src/config/parse.js": "import { parseJsonValue } from '../utils/json.js';\nexport function parseConfig(input) { return { port: Number(input.port ?? 3000), featureFlags: parseJsonValue(input.featureFlags, {}) }; }\n",
  "src/config/defaults.js": "export const defaults = { port: 3000, featureFlags: '{}' };\n",
  "src/config/env.js": "export function readEnv(env) { return { port: env.PORT, featureFlags: env.FEATURE_FLAGS }; }\n",
  "src/services/user-service.js": "import { userRepository } from '../repositories/user-repo.js';\nimport { User } from '../domain/user.js';\nexport function createUserService() { return { async find(id) { const row = await userRepository.find(id); return row ? new User(row) : null; } }; }\n",
  "src/services/audit-service.js": "import { auditRepository } from '../repositories/audit-repo.js';\nexport function createAuditService() { return { record(event) { return auditRepository.append(event); } }; }\n",
  "src/services/report-service.js": "import { reportRepository } from '../repositories/report-repo.js';\nimport { Report } from '../domain/report.js';\nimport { metric } from '../telemetry/metrics.js';\nexport async function createReport(app, kind) { metric('report.create'); const row = await reportRepository.load(kind); app.audit.record({ kind }); return new Report(row); }\n",
  "src/repositories/user-repo.js": "import { storage } from '../storage/client.js';\nexport const userRepository = { find(id) { return storage.get(`user:${id}`); } };\n",
  "src/repositories/audit-repo.js": "import { transaction } from '../storage/transactions.js';\nexport const auditRepository = { append(event) { return transaction(() => event); } };\n",
  "src/repositories/report-repo.js": "import { storage } from '../storage/client.js';\nexport const reportRepository = { load(kind) { return storage.get(`report:${kind}`); } };\n",
  "src/http/router.js": "import { usersHandler } from './handlers/users.js';\nimport { healthHandler } from './handlers/health.js';\nimport { reportsHandler } from './handlers/reports.js';\nexport function createRouter(app) { return { users: usersHandler(app), health: healthHandler(app), reports: reportsHandler(app) }; }\n",
  "src/http/handlers/users.js": "export function usersHandler(app) { return async id => app.users.find(id); }\n",
  "src/http/handlers/health.js": "import { now } from '../../utils/clock.js';\nexport function healthHandler() { return () => ({ ok: true, at: now() }); }\n",
  "src/http/handlers/reports.js": "import { createReport } from '../../services/report-service.js';\nexport function reportsHandler(app) { return kind => createReport(app, kind); }\n",
  "src/domain/user.js": "export class User { constructor(row) { Object.assign(this, row); } }\n",
  "src/domain/report.js": "export class Report { constructor(row = {}) { Object.assign(this, row); } }\n",
  "src/utils/logger.js": "import { trace } from '../telemetry/tracing.js';\nexport function logger(event, detail) { trace(event, detail); }\n",
  "src/utils/clock.js": "export function now() { return new Date().toISOString(); }\n",
  "src/utils/ids.js": "export function makeId(prefix, value) { return `${prefix}:${value}`; }\n",
  "src/utils/json.js": "export function parseJsonValue(value, fallback) { try { return JSON.parse(value ?? ''); } catch { return fallback; } }\n",
  "src/cycle/a.js": "import { cycleB } from './b.js';\nexport function warmCycle() { return cycleB('a'); }\nexport function cycleA(value) { return `a:${value}`; }\n",
  "src/cycle/b.js": "import { cycleA } from './a.js';\nexport function cycleB(value) { return cycleA(`b:${value}`); }\n",
  "scripts/migrate.js": "import { transaction } from '../src/storage/transactions.js';\nexport async function migrate() { return transaction(() => 'migrated'); }\nif (import.meta.url === `file://${process.argv[1]}`) migrate();\n",
  "scripts/seed.js": "import { storage } from '../src/storage/client.js';\nexport async function seed() { return storage.set('seeded', true); }\nif (import.meta.url === `file://${process.argv[1]}`) seed();\n",
  "src/workers/nightly.js": "import { createReport } from '../services/report-service.js';\nimport { bootstrap } from '../app/bootstrap.js';\nexport async function nightly() { const app = await bootstrap('nightly'); return createReport(app, 'nightly'); }\n",
  "src/workers/cleanup.js": "import { transaction } from '../storage/transactions.js';\nexport function cleanup() { return transaction(() => 'clean'); }\n",
  "src/features/flags.js": "import { rollout } from './rollout.js';\nexport function enabled(flags, name) { return Boolean(flags[name] ?? rollout(name)); }\n",
  "src/features/rollout.js": "export function rollout(name) { return name === 'stable'; }\n",
  "src/storage/client.js": "const db = new Map();\nexport const storage = { async get(key) { return db.get(key) ?? null; }, async set(key, value) { db.set(key, value); return value; } };\n",
  "src/storage/transactions.js": "import { storage } from './client.js';\nexport async function transaction(fn) { await storage.get('tx'); return fn(); }\n",
  "src/telemetry/metrics.js": "export function metric(name) { return name; }\n",
  "src/telemetry/tracing.js": "export function trace(event, detail) { return { event, detail }; }\n"
};

export const DOGFOOD_FILE_COUNT = Object.keys(DOGFOOD_FILES).length;

export function materializeDogfoodRepository(root) {
  for (const [repoPath, content] of Object.entries(DOGFOOD_FILES)) {
    const absolute = path.join(root, ...repoPath.split("/"));
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content, "utf8");
  }
  return { root, files: DOGFOOD_FILE_COUNT };
}
