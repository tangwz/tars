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

  it("falls back to v1 auth metadata when v2 is missing", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "plugin:sql|load") {
        return "sqlite:tars.db";
      }

      if (cmd === "plugin:sql|select") {
        const query = normalizeQuery((payload as { query?: string })?.query);
        const values = ((payload as { values?: unknown[] })?.values ?? []) as unknown[];

        if (query.startsWith("select value from app_meta where key =")) {
          const key = String(values[0]);

          if (key === "runtime_auth_metadata_v2") {
            return [];
          }

          if (key === "runtime_auth_metadata_v1") {
            return [
              {
                value: JSON.stringify({
                  glm: {
                    runtimeId: "glm",
                    status: "expired",
                    authMethod: "apiKey",
                    verifiedAt: 456,
                  },
                }),
              },
            ];
          }
        }

        return [];
      }

      if (cmd === "plugin:sql|execute") {
        return [0, null];
      }

      return undefined;
    });

    await expect(getRuntimeAuthMetadataMap()).resolves.toEqual({
      glm: {
        runtimeId: "glm",
        status: "expired",
        authMethod: "apiKey",
        verifiedAt: 456,
      },
    });
  });
});
