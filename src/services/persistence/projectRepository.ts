import Database from "@tauri-apps/plugin-sql";

const DATABASE_PATH = "sqlite:tars.db";
const DEFAULT_RECENT_LIMIT = 5;

export interface RecentProject {
  path: string;
  name: string;
  openedAt: number;
}

export interface RecentProjectInput {
  path: string;
  name: string;
  openedAt?: number;
}

interface RecentProjectRow {
  path: string;
  name: string;
  opened_at: number;
}

interface MetaRow {
  value: string;
}

let databasePromise: Promise<Database> | null = null;

async function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = Database.load(DATABASE_PATH);
  }

  return databasePromise;
}

export async function initializeProjectDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    "CREATE TABLE IF NOT EXISTS recent_projects (path TEXT PRIMARY KEY, name TEXT NOT NULL, opened_at INTEGER NOT NULL)",
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_recent_projects_opened_at ON recent_projects(opened_at DESC)",
  );
  await db.execute(
    "CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)",
  );
}

export async function listRecentProjects(limit = DEFAULT_RECENT_LIMIT): Promise<RecentProject[]> {
  const db = await getDatabase();

  const rows = await db.select<RecentProjectRow[]>(
    "SELECT path, name, opened_at FROM recent_projects ORDER BY opened_at DESC LIMIT $1",
    [limit],
  );

  return rows.map((row) => ({
    path: row.path,
    name: row.name,
    openedAt: row.opened_at,
  }));
}

export async function upsertRecentProject(input: RecentProjectInput): Promise<void> {
  const db = await getDatabase();
  const openedAt = input.openedAt ?? Date.now();

  await db.execute(
    "INSERT INTO recent_projects (path, name, opened_at) VALUES ($1, $2, $3) ON CONFLICT(path) DO UPDATE SET name = excluded.name, opened_at = excluded.opened_at",
    [input.path, input.name, openedAt],
  );

  await db.execute(
    "DELETE FROM recent_projects WHERE path IN (SELECT path FROM recent_projects ORDER BY opened_at DESC LIMIT -1 OFFSET $1)",
    [DEFAULT_RECENT_LIMIT],
  );
}

export async function removeRecentProject(path: string): Promise<void> {
  const db = await getDatabase();

  await db.execute("DELETE FROM recent_projects WHERE path = $1", [path]);
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDatabase();

  const rows = await db.select<MetaRow[]>("SELECT value FROM app_meta WHERE key = $1 LIMIT 1", [key]);

  return rows[0]?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    "INSERT INTO app_meta (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    [key, value, Date.now()],
  );
}
