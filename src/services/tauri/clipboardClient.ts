import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { getErrorMessage } from "./errorMessage";

export async function writeClipboardText(text: string): Promise<void> {
  try {
    await writeText(text);
  } catch (error) {
    throw new Error(`Failed to write clipboard text: ${getErrorMessage(error)}`);
  }
}

export async function readClipboardText(): Promise<string> {
  try {
    return await readText();
  } catch (error) {
    throw new Error(`Failed to read clipboard text: ${getErrorMessage(error)}`);
  }
}
