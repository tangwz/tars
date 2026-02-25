import { describe, expect, it } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import { openSingleFile } from "../../src/lib/tauri/dialogClient";

describe("dialogClient", () => {
  it("returns null when user cancels dialog", async () => {
    mockIPC((cmd, payload) => {
      expect(cmd).toBe("plugin:dialog|open");
      expect(payload).toEqual({
        options: {
          multiple: false,
          directory: false,
          title: "Select a file",
        },
      });

      return null;
    });

    await expect(openSingleFile()).resolves.toBeNull();
  });
});
