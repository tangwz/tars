import { beforeEach, describe, expect, it } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import {
  getRuntimeAuthMetadataMap,
  getRuntimeDefaultSelection,
  setRuntimeAuthMetadataMap,
  setRuntimeDefaultSelection,
} from "../../src/lib/persistence/runtimeRepository";

function normalizeQuery(query: unknown): string {
  if (typeof query !== "string") {
    return "";
  }

  return query.replace(/\s+/g, " ").trim().toLowerCase();
}

describe("runtimeRepository", () => {
  beforeEach(() => {
    const appMeta = new Map<string, string>();

    mockIPC((cmd, payload) => {
      if (cmd === "plugin:sql|load") {
        return "sqlite:tars.db";
      }

      if (cmd === "plugin:sql|execute") {
        const query = normalizeQuery((payload as { query?: string })?.query);
        const values = (((payload as { values?: unknown[] })?.values ?? []) as unknown[]).slice();

        if (query.startsWith("insert into app_meta")) {
          const key = String(values[0]);
          const value = String(values[1]);
          appMeta.set(key, value);
          return [1, null];
        }

        return [0, null];
      }

      if (cmd === "plugin:sql|select") {
        const query = normalizeQuery((payload as { query?: string })?.query);
        const values = ((payload as { values?: unknown[] })?.values ?? []) as unknown[];

        if (query.startsWith("select value from app_meta where key =")) {
          const key = String(values[0]);
          const value = appMeta.get(key);
          return value ? [{ value }] : [];
        }

        return [];
      }

      return undefined;
    });
  });

  it("reads and writes default runtime selection", async () => {
    await setRuntimeDefaultSelection({ defaultRuntimeId: "codex" });
    await expect(getRuntimeDefaultSelection()).resolves.toEqual({ defaultRuntimeId: "codex" });
  });

  it("reads and writes runtime auth metadata", async () => {
    await setRuntimeAuthMetadataMap({
      kimi: {
        runtimeId: "kimi",
        status: "authorized",
        authMethod: "apiKey",
        verifiedAt: 123,
        accountLabel: "sk-****5678",
      },
    });

    await expect(getRuntimeAuthMetadataMap()).resolves.toEqual({
      kimi: {
        runtimeId: "kimi",
        status: "authorized",
        authMethod: "apiKey",
        verifiedAt: 123,
        accountLabel: "sk-****5678",
      },
    });
  });
});
