import { describe, expect, it } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import { readClipboardText, writeClipboardText } from "../../src/lib/tauri/clipboardClient";

describe("clipboardClient", () => {
  it("writes unicode text through clipboard plugin", async () => {
    mockIPC((cmd, payload) => {
      expect(cmd).toBe("plugin:clipboard-manager|write_text");
      expect(payload).toEqual({ text: "Hello 你好 🌍", opts: undefined });
      return undefined;
    });

    await expect(writeClipboardText("Hello 你好 🌍")).resolves.toBeUndefined();
  });

  it("wraps clipboard read failures", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:clipboard-manager|read_text") {
        throw new Error("clipboard read blocked");
      }

      return undefined;
    });

    await expect(readClipboardText()).rejects.toThrow(
      "Failed to read clipboard text: clipboard read blocked",
    );
  });
});
