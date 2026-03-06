import { useEffect } from "react";
import { initializeProjectDatabase } from "@/services/persistence/projectRepository";
import { getRuntimeAuthMetadataMap, getRuntimeDefaultSelection, setRuntimeAuthMetadataMap } from "@/services/persistence/runtimeRepository";
import { getRuntimeAuthAvailability, getRuntimeSecretStatuses } from "@/services/tauri/runtimeSecretClient";
import { useRuntimeStore } from "@/stores/runtimeStore";
import { useUIStore } from "@/stores/uiStore";

export function useRuntimeBootstrap() {
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        await initializeProjectDatabase();

        const [defaultSelection, metadataById, availabilityById] = await Promise.all([
          getRuntimeDefaultSelection(),
          getRuntimeAuthMetadataMap(),
          getRuntimeAuthAvailability(),
        ]);

        if (!active) {
          return;
        }

        const runtimeIds = Object.keys(metadataById) as Array<"kimi" | "codex" | "gemini-cli" | "glm">;
        const secretStatuses = runtimeIds.length > 0 ? await getRuntimeSecretStatuses(runtimeIds) : [];
        const secretStatusById = Object.fromEntries(secretStatuses.map((status) => [status.runtimeId, status]));
        const normalizedEntries = Object.values(metadataById).map((metadata) => {
          if (!metadata) {
            return null;
          }

          const secretStatus = secretStatusById[metadata.runtimeId];
          const expiresAt = secretStatus?.expiresAt ?? metadata.expiresAt;
          const isExpired = !secretStatus?.exists || (typeof expiresAt === "number" && expiresAt <= Date.now());

          return [
            metadata.runtimeId,
            {
              ...metadata,
              expiresAt,
              status: isExpired ? "expired" : metadata.status,
            },
          ] as const;
        });

        if (!active) {
          return;
        }

        useRuntimeStore.getState().setDefaultRuntimeId(defaultSelection.defaultRuntimeId);
        useRuntimeStore.getState().setRuntimeAuthAvailabilityById(availabilityById);
        const normalizedMetadata = Object.fromEntries(normalizedEntries.filter((entry) => entry !== null));
        useRuntimeStore.getState().replaceAuthMetadataById(normalizedMetadata);

        if (JSON.stringify(normalizedMetadata) !== JSON.stringify(metadataById)) {
          await setRuntimeAuthMetadataMap(normalizedMetadata);
        }
      } catch (error) {
        useUIStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
      } finally {
        if (active) {
          useRuntimeStore.getState().setRuntimeBootstrapped(true);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);
}
