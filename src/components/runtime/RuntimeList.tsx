import { getRuntimeCatalogItem, listRuntimeCatalog } from "@/features/runtime/runtimeCatalog";
import type { RuntimeAuthMetadata, RuntimeId, RuntimeKind } from "@/features/runtime/runtimeTypes";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";

interface RuntimeListProps {
  locale: Locale;
  filter: "all" | RuntimeKind;
  selectedRuntimeId: RuntimeId;
  defaultRuntimeId: RuntimeId | null;
  authMetadataById: Partial<Record<RuntimeId, RuntimeAuthMetadata>>;
  onChangeFilter: (filter: "all" | RuntimeKind) => void;
  onSelectRuntime: (runtimeId: RuntimeId) => void;
}

function getStatusLabel(locale: Locale, metadata?: RuntimeAuthMetadata): string {
  if (!metadata) {
    return t(locale, "workspace.runtime.badgeNeedsAuth");
  }

  if (metadata.status === "expired") {
    return t(locale, "workspace.runtime.badgeExpired");
  }

  return t(locale, "workspace.runtime.badgeAuthorized");
}

export function RuntimeList(props: RuntimeListProps) {
  const { locale, filter, selectedRuntimeId, defaultRuntimeId, authMetadataById, onChangeFilter, onSelectRuntime } = props;

  return (
    <div className="runtime-selector-list">
      <div className="runtime-selector-filter-group" role="tablist">
        {(["all", "llm", "coding-agent"] as const).map((nextFilter) => {
          const label =
            nextFilter === "all"
              ? t(locale, "workspace.runtime.filterAll")
              : nextFilter === "llm"
                ? t(locale, "workspace.runtime.filterLlm")
                : t(locale, "workspace.runtime.filterCodingAgent");

          return (
            <button
              aria-selected={filter === nextFilter}
              className={`runtime-selector-filter-chip${filter === nextFilter ? " is-active" : ""}`}
              key={nextFilter}
              onClick={() => {
                onChangeFilter(nextFilter);
              }}
              role="tab"
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="runtime-selector-items">
        {listRuntimeCatalog(filter).map((runtime) => {
          const metadata = authMetadataById[runtime.id];
          const isSelected = selectedRuntimeId === runtime.id;
          const isDefault = defaultRuntimeId === runtime.id;

          return (
            <button
              className={`runtime-selector-item${isSelected ? " is-active" : ""}`}
              key={runtime.id}
              onClick={() => {
                onSelectRuntime(runtime.id);
              }}
              type="button"
            >
              <div className="runtime-selector-item-header">
                <div className="runtime-selector-item-title-group">
                  <span className="runtime-selector-item-title">{runtime.displayName}</span>
                  <span className="runtime-selector-kind-badge">
                    {runtime.kind === "llm" ? t(locale, "workspace.runtime.badgeLlm") : t(locale, "workspace.runtime.badgeCodingAgent")}
                  </span>
                </div>
                <span className={`runtime-selector-auth-badge${metadata?.status === "expired" ? " is-warning" : ""}`}>
                  {getStatusLabel(locale, metadata)}
                </span>
              </div>

              <p className="runtime-selector-item-description">{runtime.description}</p>

              <div className="runtime-selector-item-meta">
                {isDefault ? <span>{t(locale, "workspace.runtime.defaultBadge")}</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getRuntimeDisplayName(runtimeId: RuntimeId | null): string {
  if (!runtimeId) {
    return "";
  }

  return getRuntimeCatalogItem(runtimeId).displayName;
}
