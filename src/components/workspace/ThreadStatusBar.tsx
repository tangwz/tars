import { ChevronDown, GitBranch, Laptop, ShieldAlert } from "lucide-react";
import { MenuPanel } from "@/components/ui/MenuPanel";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";
import type { ThreadStatusMeta } from "@/components/workspace/mockWorkspaceThreads";

export type ThreadStatusMenuId = "access" | "branch" | "workspace" | null;

interface ThreadStatusBarProps {
  accessLevel: ThreadStatusMeta["accessLevel"];
  branchName: string;
  locale: Locale;
  onSelectAccessLevel: (value: ThreadStatusMeta["accessLevel"]) => void;
  onToggleMenu: (menu: Exclude<ThreadStatusMenuId, null>) => void;
  openMenu: ThreadStatusMenuId;
}

function getAccessLabel(locale: Locale, accessLevel: ThreadStatusMeta["accessLevel"]): string {
  if (accessLevel === "read-only") {
    return t(locale, "workspace.thread.readOnly");
  }

  if (accessLevel === "workspace-write") {
    return t(locale, "workspace.thread.workspaceWrite");
  }

  return t(locale, "workspace.thread.fullAccess");
}

export function ThreadStatusBar(props: ThreadStatusBarProps) {
  const { accessLevel, branchName, locale, onSelectAccessLevel, onToggleMenu, openMenu } = props;

  return (
    <div className="thread-status-bar">
      <div className="thread-status-group">
        <div className="thread-status-control">
          <button
            aria-label={t(locale, "workspace.thread.local")}
            aria-expanded={openMenu === "workspace"}
            aria-haspopup="menu"
            className="thread-status-button"
            onClick={() => {
              onToggleMenu("workspace");
            }}
            type="button"
          >
            <Laptop className="thread-status-icon" />
            <span>{t(locale, "workspace.thread.local")}</span>
            <ChevronDown className="thread-status-chevron" />
          </button>

          {openMenu === "workspace" ? (
            <MenuPanel ariaLabel={t(locale, "workspace.thread.workspaceMenuAria")} className="thread-status-menu">
              <button className="thread-panel-menu-item is-active" type="button">
                {t(locale, "workspace.thread.local")}
              </button>
            </MenuPanel>
          ) : null}
        </div>

        <div className="thread-status-control">
          <button
            aria-label={getAccessLabel(locale, accessLevel)}
            aria-expanded={openMenu === "access"}
            aria-haspopup="menu"
            className="thread-status-button is-warning"
            onClick={() => {
              onToggleMenu("access");
            }}
            type="button"
          >
            <ShieldAlert className="thread-status-icon" />
            <span>{getAccessLabel(locale, accessLevel)}</span>
            <ChevronDown className="thread-status-chevron" />
          </button>

          {openMenu === "access" ? (
            <MenuPanel ariaLabel={t(locale, "workspace.thread.accessMenuAria")} className="thread-status-menu">
              {(["read-only", "workspace-write", "full-access"] as const).map((accessOption) => (
                <button
                  className={`thread-panel-menu-item${accessLevel === accessOption ? " is-active" : ""}`}
                  key={accessOption}
                  onClick={() => {
                    onSelectAccessLevel(accessOption);
                  }}
                  type="button"
                >
                  {getAccessLabel(locale, accessOption)}
                </button>
              ))}
            </MenuPanel>
          ) : null}
        </div>
      </div>

      <div className="thread-status-control">
        <button
          aria-label={branchName}
          aria-expanded={openMenu === "branch"}
          aria-haspopup="menu"
          className="thread-status-button"
          onClick={() => {
            onToggleMenu("branch");
          }}
          type="button"
        >
          <GitBranch className="thread-status-icon" />
          <span>{branchName}</span>
          <ChevronDown className="thread-status-chevron" />
        </button>

        {openMenu === "branch" ? (
          <MenuPanel ariaLabel={t(locale, "workspace.thread.branchMenuAria")} className="thread-status-menu">
            <button className="thread-panel-menu-item is-active" type="button">
              {branchName}
            </button>
          </MenuPanel>
        ) : null}
      </div>
    </div>
  );
}
