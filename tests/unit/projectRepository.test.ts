import { beforeEach, describe, expect, it } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import {
  getMeta,
  initializeProjectDatabase,
  listRecentProjects,
  removeRecentProject,
  setMeta,
  upsertRecentProject,
} from "../../src/lib/persistence/projectRepository";

interface RecentProjectRow {
  path: string;
  name: string;
  opened_at: number;
}

function normalizeQuery(query: unknown): string {
  if (typeof query !== "string") {
    return "";
  }

  return query.replace(/\s+/g, " ").trim().toLowerCase();
}

describe("projectRepository", () => {
  beforeEach(() => {
    const recentProjects = new Map<string, RecentProjectRow>();
    const appMeta = new Map<string, string>();

    mockIPC((cmd, payload) => {
      if (cmd === "plugin:sql|load") {
        return "sqlite:tars.db";
      }

      if (cmd === "plugin:sql|execute") {
        const query = normalizeQuery((payload as { query?: string })?.query);
        const values = (((payload as { values?: unknown[] })?.values ?? []) as unknown[]).slice();

        if (query.startsWith("create table if not exists recent_projects")) {
          return [0, null];
        }

        if (query.startsWith("create index if not exists idx_recent_projects_opened_at")) {
          return [0, null];
        }

        if (query.startsWith("create table if not exists app_meta")) {
          return [0, null];
        }

        if (query.startsWith("insert into recent_projects")) {
          const path = String(values[0]);
          const name = String(values[1]);
          const openedAt = Number(values[2]);
          recentProjects.set(path, { path, name, opened_at: openedAt });
          return [1, null];
        }

        if (query.startsWith("delete from recent_projects where path in")) {
          const keep = Number(values[0]);
          const sorted = Array.from(recentProjects.values()).sort((a, b) => b.opened_at - a.opened_at);
          const overflow = sorted.slice(keep);

          overflow.forEach((row) => {
            recentProjects.delete(row.path);
          });

          return [overflow.length, null];
        }

        if (query.startsWith("delete from recent_projects where path =")) {
          const path = String(values[0]);
          const existed = recentProjects.delete(path);
          return [existed ? 1 : 0, null];
        }

        if (query.startsWith("insert into app_meta")) {
          const key = String(values[0]);
          const value = String(values[1]);
          appMeta.set(key, value);
          return [1, null];
        }

        throw new Error(`Unhandled execute query: ${query}`);
      }

      if (cmd === "plugin:sql|select") {
        const query = normalizeQuery((payload as { query?: string })?.query);
        const values = ((payload as { values?: unknown[] })?.values ?? []) as unknown[];

        if (query.startsWith("select path, name, opened_at from recent_projects")) {
          const limit = Number(values[0]);
          return Array.from(recentProjects.values())
            .sort((a, b) => b.opened_at - a.opened_at)
            .slice(0, limit);
        }

        if (query.startsWith("select value from app_meta where key =")) {
          const key = String(values[0]);
          const value = appMeta.get(key);
          return value ? [{ value }] : [];
        }

        throw new Error(`Unhandled select query: ${query}`);
      }

      return undefined;
    });
  });

  it("initializes schema and returns empty recent projects", async () => {
    await initializeProjectDatabase();
    await expect(listRecentProjects()).resolves.toEqual([]);
  });

  it("inserts a project and reads it back", async () => {
    await initializeProjectDatabase();
    await upsertRecentProject({ path: "/tmp/repo-a", name: "repo-a", openedAt: 100 });

    await expect(listRecentProjects()).resolves.toEqual([
      { path: "/tmp/repo-a", name: "repo-a", openedAt: 100 },
    ]);
  });

  it("upserts by path without creating duplicates", async () => {
    await initializeProjectDatabase();
    await upsertRecentProject({ path: "/tmp/repo-a", name: "repo-a", openedAt: 100 });
    await upsertRecentProject({ path: "/tmp/repo-a", name: "repo-a-updated", openedAt: 200 });

    await expect(listRecentProjects()).resolves.toEqual([
      { path: "/tmp/repo-a", name: "repo-a-updated", openedAt: 200 },
    ]);
  });

  it("keeps only 5 most recent projects", async () => {
    await initializeProjectDatabase();

    for (let index = 1; index <= 6; index += 1) {
      await upsertRecentProject({
        path: `/tmp/repo-${index}`,
        name: `repo-${index}`,
        openedAt: index,
      });
    }

    const projects = await listRecentProjects(10);
    expect(projects).toHaveLength(5);
    expect(projects[0]?.path).toBe("/tmp/repo-6");
    expect(projects[4]?.path).toBe("/tmp/repo-2");
  });

  it("removes a project by path", async () => {
    await initializeProjectDatabase();
    await upsertRecentProject({ path: "/tmp/repo-a", name: "repo-a", openedAt: 100 });
    await removeRecentProject("/tmp/repo-a");

    await expect(listRecentProjects()).resolves.toEqual([]);
  });

  it("reads and writes app meta values", async () => {
    await initializeProjectDatabase();
    await setMeta("last_project_path", "/tmp/workspace");

    await expect(getMeta("last_project_path")).resolves.toBe("/tmp/workspace");
    await expect(getMeta("missing")).resolves.toBeNull();
  });
});
