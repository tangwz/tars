import { exists, readTextFile, stat } from "@tauri-apps/plugin-fs";
import { getErrorMessage } from "./errorMessage";

export async function readTextFromPath(path: string): Promise<string> {
  if (!path) {
    throw new Error("Path is required.");
  }

  try {
    return await readTextFile(path);
  } catch (error) {
    throw new Error(`Failed to read text file at \"${path}\": ${getErrorMessage(error)}`);
  }
}

export async function directoryExists(path: string): Promise<boolean> {
  if (!path) {
    return false;
  }

  try {
    const found = await exists(path);

    if (!found) {
      return false;
    }

    const info = await stat(path);
    return info.isDirectory;
  } catch (error) {
    throw new Error(`Failed to validate project directory at \"${path}\": ${getErrorMessage(error)}`);
  }
}
