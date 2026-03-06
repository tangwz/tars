import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { RuntimeAuthPanel } from "@/components/runtime/RuntimeAuthPanel";
import { RuntimeList } from "@/components/runtime/RuntimeList";
import { Modal } from "@/components/ui/Modal";
import { getPreferredRuntimeAuthMethod } from "@/features/runtime/runtimeAuthCapabilities";
import { getRuntimeCatalogItem, runtimeCatalog } from "@/features/runtime/runtimeCatalog";
import { getRuntimeAuthErrorMessage } from "@/features/runtime/runtimeAuthErrors";
import { pollRuntimeOAuthSessionUntilSettled } from "@/features/runtime/runtimeOAuthPolling";
import { runtimeAuthService } from "@/features/runtime/runtimeAuthService";
import type { AuthMethod, RuntimeAuthError, RuntimeAuthMetadata, RuntimeId } from "@/features/runtime/runtimeTypes";
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
  const runtimeAuthAvailabilityById = useRuntimeStore(runtimeSelectors.runtimeAuthAvailabilityById);
  const selectedThreadId = useWorkspaceStore(workspaceSelectors.selectedThreadId);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<AuthMethod>("apiKey");
  const [apiKey, setApiKey] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const pollingAbortRef = useRef<AbortController | null>(null);

  const selectedRuntimeId = runtimeModal.selectedRuntimeId
    ? runtimeModal.selectedRuntimeId
    : getInitialSelectedRuntimeId(null, defaultRuntimeId);

  const selectedRuntime = useMemo(() => getRuntimeCatalogItem(selectedRuntimeId), [selectedRuntimeId]);
  const selectedMetadata = authMetadataById[selectedRuntimeId];
  const selectedRuntimeAuthAvailability = runtimeAuthAvailabilityById[selectedRuntimeId];

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

    setSelectedAuthMethod(getPreferredRuntimeAuthMethod(selectedRuntime.id, selectedRuntimeAuthAvailability));
    setApiKey("");
    setSetAsDefault(selectedRuntime.id === defaultRuntimeId);
  }, [defaultRuntimeId, runtimeModal.isOpen, selectedRuntime.id, selectedRuntimeAuthAvailability]);

  useEffect(() => {
    if (!runtimeModal.isOpen || !runtimeModal.threadId) {
      return;
    }

    if (selectedThreadId && selectedThreadId !== runtimeModal.threadId) {
      const pendingSessionId = useUIStore.getState().runtimeModal.oauthPendingSessionId;

      if (pendingSessionId) {
        void runtimeAuthService.cancelOAuthSession(pendingSessionId).catch(() => undefined);
      }

      useUIStore.getState().closeRuntimeModal();
    }
  }, [runtimeModal.isOpen, runtimeModal.threadId, selectedThreadId]);

  useEffect(() => {
    const sessionId = runtimeModal.oauthPendingSessionId;

    if (!sessionId) {
      pollingAbortRef.current?.abort();
      pollingAbortRef.current = null;
      return;
    }

    const abortController = new AbortController();
    pollingAbortRef.current = abortController;

    void pollRuntimeOAuthSessionUntilSettled({
      sessionId,
      signal: abortController.signal,
      poll: (nextSessionId) => runtimeAuthService.pollOAuthSession(nextSessionId),
    })
      .then(async (status) => {
        if (abortController.signal.aborted) {
          return;
        }

        if (status.state === "succeeded") {
          await persistAuthorizedRuntime(status.metadata.runtimeId, status.metadata);
          await applyRuntimeSelection(status.metadata.runtimeId);
          return;
        }

        if (status.state === "failed") {
          useUIStore.getState().setRuntimeModalErrorMessage(getRuntimeAuthErrorMessage(locale, status.error));
          return;
        }

        const error: RuntimeAuthError =
          status.state === "cancelled"
            ? {
                code: "oauth_cancelled",
                message: "OAuth was cancelled.",
                recoverable: true,
              }
            : {
                code: "oauth_timeout",
                message: "OAuth timed out.",
                recoverable: true,
              };

        useUIStore.getState().setRuntimeModalErrorMessage(getRuntimeAuthErrorMessage(locale, error));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        useUIStore.getState().setRuntimeModalErrorMessage(getRuntimeAuthErrorMessage(locale, error));
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          useUIStore.getState().setRuntimeModalOAuthPendingSessionId(null);
        }

        if (pollingAbortRef.current === abortController) {
          pollingAbortRef.current = null;
        }
      });

    return () => {
      abortController.abort();
    };
  }, [locale, runtimeModal.oauthPendingSessionId]);

  const handleClose = () => {
    if (runtimeModal.isVerifying || runtimeModal.oauthPendingSessionId) {
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
      useUIStore.getState().setRuntimeModalErrorMessage(getRuntimeAuthErrorMessage(locale, error));
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
      const result = await runtimeAuthService.startOAuth(selectedRuntime.id);
      useUIStore.getState().setRuntimeModalOAuthPendingSessionId(result.sessionId);
    });
  };

  const handleCancelOAuth = async () => {
    const sessionId = useUIStore.getState().runtimeModal.oauthPendingSessionId;

    if (!sessionId) {
      return;
    }

    await withVerificationState(async () => {
      await runtimeAuthService.cancelOAuthSession(sessionId);
      useUIStore.getState().setRuntimeModalOAuthPendingSessionId(null);
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
      disableDismiss={runtimeModal.isVerifying || Boolean(runtimeModal.oauthPendingSessionId)}
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
          disabled={runtimeModal.isVerifying || Boolean(runtimeModal.oauthPendingSessionId)}
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
          authAvailability={selectedRuntimeAuthAvailability}
          apiKey={apiKey}
          errorMessage={runtimeModal.errorMessage}
          isVerifying={runtimeModal.isVerifying}
          isOAuthPending={Boolean(runtimeModal.oauthPendingSessionId)}
          locale={locale}
          metadata={selectedMetadata}
          onAuthorizeApiKey={() => {
            void handleAuthorizeApiKey();
          }}
          onAuthorizeOAuth={() => {
            void handleAuthorizeOAuth();
          }}
          onCancelOAuth={() => {
            void handleCancelOAuth();
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
