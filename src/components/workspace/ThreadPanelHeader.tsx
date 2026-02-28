import { ArrowUpRight, ChevronDown, Copy, FolderOpen, SlidersHorizontal, SquarePlus } from "lucide-react";
import { MenuPanel } from "@/components/ui/MenuPanel";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";
import type { ThreadHeaderState } from "@/components/workspace/mockWorkspaceThreads";

export type ThreadPanelMenuId = "approval" | "open-target" | null;

interface ThreadPanelHeaderProps {
  approvalMode: ThreadHeaderState["approvalMode"];
  locale: Locale;
  onCopy: () => void;
  onSelectApprovalMode: (value: ThreadHeaderState["approvalMode"]) => void;
  onSelectOpenTarget: (value: ThreadHeaderState["openTarget"]) => void;
  onToggleMenu: (menu: Exclude<ThreadPanelMenuId, null>) => void;
  openMenu: ThreadPanelMenuId;
  openTarget: ThreadHeaderState["openTarget"];
  title: string;
  usageNegative: number;
  usagePositive: number;
}

function getOpenTargetLabel(locale: Locale, value: ThreadHeaderState["openTarget"]): string {
  return value === "default" ? t(locale, "workspace.thread.openTargetDefault") : t(locale, "workspace.thread.openTargetVsCode");
}

function getApprovalModeLabel(locale: Locale, value: ThreadHeaderState["approvalMode"]): string {
  if (value === "auto") {
    return t(locale, "workspace.thread.approvalAuto");
  }

  if (value === "review") {
    return t(locale, "workspace.thread.approvalReview");
  }

  return t(locale, "workspace.thread.submit");
}

export function ThreadPanelHeader(props: ThreadPanelHeaderProps) {
  const {
    approvalMode,
    locale,
    onCopy,
    onSelectApprovalMode,
    onSelectOpenTarget,
    onToggleMenu,
    openMenu,
    openTarget,
    title,
    usageNegative,
    usagePositive,
  } = props;

  return (
    <header className="thread-panel-header" data-tauri-drag-region>
      <h2 className="thread-panel-title">{title}</h2>

      <div className="thread-panel-actions window-no-drag">
        <div className="thread-panel-control">
          <button
            aria-label={`${t(locale, "workspace.thread.open")} ${getOpenTargetLabel(locale, openTarget)}`}
            aria-expanded={openMenu === "open-target"}
            aria-haspopup="menu"
            className="thread-panel-pill-button"
            onClick={() => {
              onToggleMenu("open-target");
            }}
            type="button"
          >
            <span className="thread-panel-pill-button-main">
              <FolderOpen className="thread-panel-pill-icon" />
              <span>{t(locale, "workspace.thread.open")}</span>
            </span>
            <span className="thread-panel-pill-value">{getOpenTargetLabel(locale, openTarget)}</span>
            <ChevronDown className="thread-panel-pill-chevron" />
          </button>

          {openMenu === "open-target" ? (
            <MenuPanel ariaLabel={t(locale, "workspace.thread.openTargetMenuAria")} className="thread-panel-menu">
              <button
                className={`thread-panel-menu-item${openTarget === "vscode" ? " is-active" : ""}`}
                onClick={() => {
                  onSelectOpenTarget("vscode");
                }}
                type="button"
              >
                {t(locale, "workspace.thread.openTargetVsCode")}
              </button>
              <button
                className={`thread-panel-menu-item${openTarget === "default" ? " is-active" : ""}`}
                onClick={() => {
                  onSelectOpenTarget("default");
                }}
                type="button"
              >
                {t(locale, "workspace.thread.openTargetDefault")}
              </button>
            </MenuPanel>
          ) : null}
        </div>

        <div className="thread-panel-control">
          <button
            aria-label={`${t(locale, "workspace.thread.submit")} ${getApprovalModeLabel(locale, approvalMode)}`}
            aria-expanded={openMenu === "approval"}
            aria-haspopup="menu"
            className="thread-panel-pill-button"
            onClick={() => {
              onToggleMenu("approval");
            }}
            type="button"
          >
            <span className="thread-panel-pill-button-main">
              <SlidersHorizontal className="thread-panel-pill-icon" />
              <span>{t(locale, "workspace.thread.submit")}</span>
            </span>
            <span className="thread-panel-pill-value">{getApprovalModeLabel(locale, approvalMode)}</span>
            <ChevronDown className="thread-panel-pill-chevron" />
          </button>

          {openMenu === "approval" ? (
            <MenuPanel ariaLabel={t(locale, "workspace.thread.approvalMenuAria")} className="thread-panel-menu">
              <button
                className={`thread-panel-menu-item${approvalMode === "submit" ? " is-active" : ""}`}
                onClick={() => {
                  onSelectApprovalMode("submit");
                }}
                type="button"
              >
                {t(locale, "workspace.thread.submit")}
              </button>
              <button
                className={`thread-panel-menu-item${approvalMode === "auto" ? " is-active" : ""}`}
                onClick={() => {
                  onSelectApprovalMode("auto");
                }}
                type="button"
              >
                {t(locale, "workspace.thread.approvalAuto")}
              </button>
              <button
                className={`thread-panel-menu-item${approvalMode === "review" ? " is-active" : ""}`}
                onClick={() => {
                  onSelectApprovalMode("review");
                }}
                type="button"
              >
                {t(locale, "workspace.thread.approvalReview")}
              </button>
            </MenuPanel>
          ) : null}
        </div>

        <span aria-hidden="true" className="thread-panel-actions-divider" />

        <button
          aria-label={t(locale, "workspace.thread.openInEditor")}
          className="thread-panel-icon-button"
          type="button"
        >
          <ArrowUpRight className="thread-panel-icon" />
        </button>

        <button
          aria-label={t(locale, "workspace.thread.newPane")}
          className="thread-panel-icon-button"
          type="button"
        >
          <SquarePlus className="thread-panel-icon" />
        </button>

        <div className="thread-panel-usage">
          <span className="thread-panel-usage-positive">+{usagePositive}</span>
          <span className="thread-panel-usage-negative">-{usageNegative}</span>
        </div>

        <button
          aria-label={t(locale, "workspace.thread.copyThread")}
          className="thread-panel-icon-button"
          onClick={onCopy}
          type="button"
        >
          <Copy className="thread-panel-icon" />
        </button>
      </div>
    </header>
  );
}
