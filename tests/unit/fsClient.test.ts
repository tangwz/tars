import { describe, expect, it } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import { readTextFromPath } from "../../src/lib/tauri/fsClient";

describe("fsClient", () => {
  it("reads text content from plugin fs command", async () => {
    mockIPC((cmd, payload) => {
      expect(cmd).toBe("plugin:fs|read_text_file");
      expect(payload).toEqual({ path: "/tmp/demo.txt", options: undefined });
      return [72, 101, 108, 108, 111];
    });

    await expect(readTextFromPath("/tmp/demo.txt")).resolves.toBe("Hello");
  });

  it("wraps read failures with context", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:fs|read_text_file") {
        throw new Error("permission denied");
      }

      return undefined;
    });

    await expect(readTextFromPath("/tmp/nope.txt")).rejects.toThrow(
      'Failed to read text file at "/tmp/nope.txt": permission denied',
    );
  });
});
