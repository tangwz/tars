import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { RuntimeAuthPanel } from "@/components/runtime/RuntimeAuthPanel";
import { RuntimeList } from "@/components/runtime/RuntimeList";
import { Modal } from "@/components/ui/Modal";
import { getRuntimeCatalogItem, runtimeCatalog } from "@/features/runtime/runtimeCatalog";
import { runtimeAuthService } from "@/features/runtime/runtimeAuthService";
import type { AuthMethod, RuntimeAuthMetadata, RuntimeId } from "@/features/runtime/runtimeTypes";
import { getRuntimeAuthMetadataMap, setRuntimeAuthMetadataMap, setRuntimeDefaultSelection } from "@/services/persistence/runtimeRepository";
import { localeSelectors, useLocaleStore } from "@/stores/localeStore";
import { runtimeSelectors, useRuntimeStore } from "@/stores/runtimeStore";
import { uiSelectors, useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore, workspaceSelectors } from "@/stores/workspaceStore";
import { t } from "@/i18n/translate";

function getInitialSelectedRuntimeId(currentRuntimeId: RuntimeId | null, defaultRuntimeId: RuntimeId | null): RuntimeId {
  return currentRuntimeId ?? defaultRuntimeId ?? runtimeCatalog[0].id;
}

export function RuntimeSelectionModal() {
  const locale = useLocaleStore(localeSelectors.locale);
  const runtimeModal = useUIStore(uiSelectors.runtimeModal);
  const defaultRuntimeId = useRuntimeStore(runtimeSelectors.defaultRuntimeId);
  const authMetadataById = useRuntimeStore(runtimeSelectors.authMetadataById);
  const selectedThreadId = useWorkspaceStore(workspaceSelectors.selectedThreadId);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<AuthMethod>("apiKey");
  const [apiKey, setApiKey] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);

  const selectedRuntimeId = runtimeModal.selectedRuntimeId
    ? runtimeModal.selectedRuntimeId
    : getInitialSelectedRuntimeId(null, defaultRuntimeId);

  const selectedRuntime = useMemo(() => getRuntimeCatalogItem(selectedRuntimeId), [selectedRuntimeId]);
  const selectedMetadata = authMetadataById[selectedRuntimeId];

  useEffect(() => {
    if (!runtimeModal.isOpen) {
      return;
    }

    useUIStore.getState().setRuntimeModalSelectedRuntimeId(getInitialSelectedRuntimeId(runtimeModal.selectedRuntimeId, defaultRuntimeId));
  }, [defaultRuntimeId, runtimeModal.isOpen, runtimeModal.selectedRuntimeId]);

  useEffect(() => {
    if (!runtimeModal.isOpen) {
      return;
    }

    setSelectedAuthMethod(selectedRuntime.defaultAuthMethod);
    setApiKey("");
    setSetAsDefault(selectedRuntime.id === defaultRuntimeId);
  }, [defaultRuntimeId, runtimeModal.isOpen, selectedRuntime.defaultAuthMethod, selectedRuntime.id]);

  useEffect(() => {
    if (!runtimeModal.isOpen || !runtimeModal.threadId) {
      return;
    }

    if (selectedThreadId && selectedThreadId !== runtimeModal.threadId) {
      useUIStore.getState().closeRuntimeModal();
    }
  }, [runtimeModal.isOpen, runtimeModal.threadId, selectedThreadId]);

  const handleClose = () => {
    if (runtimeModal.isVerifying) {
      return;
    }

    useUIStore.getState().closeRuntimeModal();
  };

  const persistAuthorizedRuntime = async (runtimeId: RuntimeId, metadata: RuntimeAuthMetadata) => {
    const nextMetadataById = {
      ...(await getRuntimeAuthMetadataMap()),
      [runtimeId]: metadata,
    };

    await setRuntimeAuthMetadataMap(nextMetadataById);
    useRuntimeStore.getState().setAuthMetadata(metadata);
  };

  const applyRuntimeSelection = async (runtimeId: RuntimeId) => {
    const threadId = useUIStore.getState().runtimeModal.threadId;

    if (threadId) {
      useWorkspaceStore.getState().setThreadRuntimeOverride(threadId, runtimeId);
    }

    if (setAsDefault) {
      await setRuntimeDefaultSelection({ defaultRuntimeId: runtimeId });
      useRuntimeStore.getState().setDefaultRuntimeId(runtimeId);
    }

    useUIStore.getState().closeRuntimeModal();
  };

  const withVerificationState = async (action: () => Promise<void>) => {
    useUIStore.getState().setRuntimeModalErrorMessage("");
    useUIStore.getState().setRuntimeModalVerifying(true);

    try {
      await action();
    } catch (error) {
      useUIStore.getState().setRuntimeModalErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      useUIStore.getState().setRuntimeModalVerifying(false);
    }
  };

  const handleAuthorizeApiKey = async () => {
    await withVerificationState(async () => {
      const metadata = await runtimeAuthService.authorizeWithApiKey(selectedRuntime.id, apiKey);
      await persistAuthorizedRuntime(selectedRuntime.id, metadata);
      await applyRuntimeSelection(selectedRuntime.id);
    });
  };

  const handleAuthorizeOAuth = async () => {
    await withVerificationState(async () => {
      const metadata = await runtimeAuthService.authorizeWithOAuth(selectedRuntime.id);
      await persistAuthorizedRuntime(selectedRuntime.id, metadata);
      await applyRuntimeSelection(selectedRuntime.id);
    });
  };

  const handleUseAuthorizedRuntime = async () => {
    await withVerificationState(async () => {
      await applyRuntimeSelection(selectedRuntime.id);
    });
  };

  const handleDisconnect = async () => {
    await withVerificationState(async () => {
      await runtimeAuthService.revoke(selectedRuntime.id);

      const nextMetadataById = await getRuntimeAuthMetadataMap();
      delete nextMetadataById[selectedRuntime.id];

      await setRuntimeAuthMetadataMap(nextMetadataById);
      useRuntimeStore.getState().removeAuthMetadata(selectedRuntime.id);

      if (defaultRuntimeId === selectedRuntime.id) {
        await setRuntimeDefaultSelection({ defaultRuntimeId: null });
        useRuntimeStore.getState().setDefaultRuntimeId(null);
      }
    });
  };

  return (
    <Modal
      className="runtime-selector-modal"
      disableDismiss={runtimeModal.isVerifying}
      isOpen={runtimeModal.isOpen}
      onRequestClose={handleClose}
      title={t(locale, "workspace.runtime.dialogTitle")}
    >
      <div className="runtime-selector-modal-header">
        <div className="runtime-selector-modal-copy">
          <h1 className="runtime-selector-modal-title">{t(locale, "workspace.runtime.dialogTitle")}</h1>
          <p className="runtime-selector-modal-description">{t(locale, "workspace.runtime.dialogDescription")}</p>
        </div>

        <button
          aria-label={t(locale, "workspace.runtime.close")}
          className="runtime-selector-close-button"
          disabled={runtimeModal.isVerifying}
          onClick={handleClose}
          type="button"
        >
          <X className="runtime-selector-close-icon" />
        </button>
      </div>

      <div className="runtime-selector-modal-body">
        <RuntimeList
          authMetadataById={authMetadataById}
          defaultRuntimeId={defaultRuntimeId}
          filter={runtimeModal.filter}
          locale={locale}
          onChangeFilter={(filter) => {
            useUIStore.getState().setRuntimeModalFilter(filter);
          }}
          onSelectRuntime={(runtimeId) => {
            useUIStore.getState().setRuntimeModalSelectedRuntimeId(runtimeId);
          }}
          selectedRuntimeId={selectedRuntime.id}
        />

        <RuntimeAuthPanel
          apiKey={apiKey}
          errorMessage={runtimeModal.errorMessage}
          isVerifying={runtimeModal.isVerifying}
          locale={locale}
          metadata={selectedMetadata}
          onAuthorizeApiKey={() => {
            void handleAuthorizeApiKey();
          }}
          onAuthorizeOAuth={() => {
            void handleAuthorizeOAuth();
          }}
          onChangeApiKey={setApiKey}
          onChangeAuthMethod={setSelectedAuthMethod}
          onChangeSetAsDefault={setSetAsDefault}
          onDisconnect={() => {
            void handleDisconnect();
          }}
          onUseAuthorizedRuntime={() => {
            void handleUseAuthorizedRuntime();
          }}
          runtimeId={selectedRuntime.id}
          selectedAuthMethod={selectedAuthMethod}
          setAsDefault={setAsDefault}
        />
      </div>
    </Modal>
  );
}
