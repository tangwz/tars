import { useEffect } from "react";
import { getRuntimeSecret } from "@/services/tauri/runtimeSecretClient";
import { getRuntimeAuthMetadataMap, getRuntimeDefaultSelection } from "@/services/persistence/runtimeRepository";
import { useRuntimeStore } from "@/stores/runtimeStore";
import { useUIStore } from "@/stores/uiStore";

export function useRuntimeBootstrap() {
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const [defaultSelection, metadataById] = await Promise.all([
          getRuntimeDefaultSelection(),
          getRuntimeAuthMetadataMap(),
        ]);

        if (!active) {
          return;
        }

        const normalizedEntries = await Promise.all(
          Object.values(metadataById).map(async (metadata) => {
            if (!metadata) {
              return null;
            }

            const secret = await getRuntimeSecret(metadata.runtimeId);

            return [
              metadata.runtimeId,
              {
                ...metadata,
                status: secret ? metadata.status : "expired",
              },
            ] as const;
          }),
        );

        if (!active) {
          return;
        }

        useRuntimeStore.getState().setDefaultRuntimeId(defaultSelection.defaultRuntimeId);
        useRuntimeStore
          .getState()
          .replaceAuthMetadataById(Object.fromEntries(normalizedEntries.filter((entry) => entry !== null)));
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
