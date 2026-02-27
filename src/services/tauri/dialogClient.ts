import { open } from "@tauri-apps/plugin-dialog";
import { getErrorMessage } from "./errorMessage";

export async function openSingleFile(): Promise<string | null> {
  try {
    const selected = await open({
      multiple: false,
      directory: false,
      title: "Select a file",
    });

    if (Array.isArray(selected)) {
      return selected[0] ?? null;
    }

    return selected;
  } catch (error) {
    throw new Error(`Failed to open file dialog: ${getErrorMessage(error)}`);
  }
}

export async function openProjectDirectory(): Promise<string | null> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Open Project",
    });

    if (Array.isArray(selected)) {
      return selected[0] ?? null;
    }

    return selected;
  } catch (error) {
    throw new Error(`Failed to open project directory: ${getErrorMessage(error)}`);
  }
}
