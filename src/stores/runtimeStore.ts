import { create } from "zustand";
import type {
  RuntimeAuthAvailabilityMap,
  RuntimeAuthMetadata,
  RuntimeId,
} from "@/features/runtime/runtimeTypes";

type RuntimeAuthMetadataMap = Partial<Record<RuntimeId, RuntimeAuthMetadata>>;

interface RuntimeState {
  isRuntimeBootstrapped: boolean;
  defaultRuntimeId: RuntimeId | null;
  authMetadataById: RuntimeAuthMetadataMap;
  runtimeAuthAvailabilityById: RuntimeAuthAvailabilityMap;
}

interface RuntimeActions {
  setRuntimeBootstrapped: (value: boolean) => void;
  setDefaultRuntimeId: (runtimeId: RuntimeId | null) => void;
  setAuthMetadata: (metadata: RuntimeAuthMetadata) => void;
  replaceAuthMetadataById: (metadataById: RuntimeAuthMetadataMap) => void;
  removeAuthMetadata: (runtimeId: RuntimeId) => void;
  setRuntimeAuthAvailabilityById: (availabilityById: RuntimeAuthAvailabilityMap) => void;
}

export type RuntimeStore = RuntimeState & RuntimeActions;

export const useRuntimeStore = create<RuntimeStore>((set) => ({
  isRuntimeBootstrapped: false,
  defaultRuntimeId: null,
  authMetadataById: {},
  runtimeAuthAvailabilityById: {},
  setRuntimeBootstrapped: (value) => set({ isRuntimeBootstrapped: value }),
  setDefaultRuntimeId: (runtimeId) => set({ defaultRuntimeId: runtimeId }),
  setAuthMetadata: (metadata) =>
    set((state) => ({
      authMetadataById: {
        ...state.authMetadataById,
        [metadata.runtimeId]: metadata,
      },
    })),
  replaceAuthMetadataById: (metadataById) => set({ authMetadataById: metadataById }),
  removeAuthMetadata: (runtimeId) =>
    set((state) => {
      const next = { ...state.authMetadataById };
      delete next[runtimeId];
      return { authMetadataById: next };
    }),
  setRuntimeAuthAvailabilityById: (availabilityById) => set({ runtimeAuthAvailabilityById: availabilityById }),
}));

export const runtimeSelectors = {
  isRuntimeBootstrapped: (state: RuntimeStore) => state.isRuntimeBootstrapped,
  defaultRuntimeId: (state: RuntimeStore) => state.defaultRuntimeId,
  authMetadataById: (state: RuntimeStore) => state.authMetadataById,
  runtimeAuthAvailabilityById: (state: RuntimeStore) => state.runtimeAuthAvailabilityById,
};
