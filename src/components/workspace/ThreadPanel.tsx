import { useEffect, useRef, useState } from "react";
import type { RecentProject } from "@/services/persistence/projectRepository";
import { writeClipboardText } from "@/lib/tauri/clipboardClient";
import type {
  ThreadComposerPreset,
  ThreadHeaderState,
  ThreadStatusMeta,
  WorkspaceThreadDetail,
} from "@/components/workspace/mockWorkspaceThreads";
import { ThreadComposer, type ThreadComposerMenuId } from "@/components/workspace/ThreadComposer";
import { ThreadEmptyState, type ThreadEmptyMenuId } from "@/components/workspace/ThreadEmptyState";
import { ThreadPanelHeader, type ThreadPanelMenuId } from "@/components/workspace/ThreadPanelHeader";
import { ThreadStatusBar, type ThreadStatusMenuId } from "@/components/workspace/ThreadStatusBar";
import type { Locale } from "@/i18n/types";

type ThreadPanelMenu = ThreadComposerMenuId | ThreadEmptyMenuId | ThreadPanelMenuId | ThreadStatusMenuId;

interface ThreadPanelProps {
  detail: WorkspaceThreadDetail;
  locale: Locale;
  recentProjects: RecentProject[];
}

export function ThreadPanel(props: ThreadPanelProps) {
  const { detail, locale, recentProjects } = props;
  const [draft, setDraft] = useState(detail.composer.draft);
  const [projectName, setProjectName] = useState(detail.projectName);
  const [openMenu, setOpenMenu] = useState<ThreadPanelMenu>(null);
  const [openTarget, setOpenTarget] = useState<ThreadHeaderState["openTarget"]>(detail.header.openTarget);
  const [approvalMode, setApprovalMode] = useState<ThreadHeaderState["approvalMode"]>(detail.header.approvalMode);
  const [model, setModel] = useState<ThreadComposerPreset["model"]>(detail.composer.model);
  const [effort, setEffort] = useState<ThreadComposerPreset["effort"]>(detail.composer.effort);
  const [mode, setMode] = useState<ThreadComposerPreset["mode"]>(detail.composer.mode);
  const [accessLevel, setAccessLevel] = useState<ThreadStatusMeta["accessLevel"]>(detail.statusBar.accessLevel);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setDraft(detail.composer.draft);
    setProjectName(detail.projectName);
    setOpenMenu(null);
    setOpenTarget(detail.header.openTarget);
    setApprovalMode(detail.header.approvalMode);
    setModel(detail.composer.model);
    setEffort(detail.composer.effort);
    setMode(detail.composer.mode);
    setAccessLevel(detail.statusBar.accessLevel);
  }, [detail]);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  const handleToggleMenu = (menu: Exclude<ThreadPanelMenu, null>) => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  };

  return (
    <section aria-label={detail.title} className="thread-panel" ref={panelRef}>
      <ThreadPanelHeader
        approvalMode={approvalMode}
        locale={locale}
        onCopy={() => {
          void writeClipboardText(detail.title).catch(() => undefined);
        }}
        onSelectApprovalMode={(value) => {
          setApprovalMode(value);
          setOpenMenu(null);
        }}
        onSelectOpenTarget={(value) => {
          setOpenTarget(value);
          setOpenMenu(null);
        }}
        onToggleMenu={handleToggleMenu}
        openMenu={openMenu === "approval" || openMenu === "open-target" ? openMenu : null}
        openTarget={openTarget}
        title={detail.title}
        usageNegative={detail.header.usageNegative}
        usagePositive={detail.header.usagePositive}
      />

      <ThreadEmptyState
        locale={locale}
        onSelectProjectName={(value) => {
          setProjectName(value);
          setOpenMenu(null);
        }}
        onToggleMenu={handleToggleMenu}
        openMenu={openMenu === "project" ? openMenu : null}
        projectName={projectName}
        recentProjects={recentProjects}
      />

      <div className="thread-panel-bottom">
        <ThreadComposer
          draft={draft}
          effort={effort}
          locale={locale}
          mode={mode}
          model={model}
          onChangeDraft={setDraft}
          onSelectEffort={(value) => {
            setEffort(value);
            setOpenMenu(null);
          }}
          onSelectMode={(value) => {
            setMode(value);
            setOpenMenu(null);
          }}
          onSelectModel={(value) => {
            setModel(value);
            setOpenMenu(null);
          }}
          onToggleMenu={handleToggleMenu}
          openMenu={openMenu === "effort" || openMenu === "mode" || openMenu === "model" ? openMenu : null}
        />

        <ThreadStatusBar
          accessLevel={accessLevel}
          branchName={detail.statusBar.branchName}
          locale={locale}
          onSelectAccessLevel={(value) => {
            setAccessLevel(value);
            setOpenMenu(null);
          }}
          onToggleMenu={handleToggleMenu}
          openMenu={openMenu === "access" || openMenu === "branch" || openMenu === "workspace" ? openMenu : null}
        />
      </div>
    </section>
  );
}
