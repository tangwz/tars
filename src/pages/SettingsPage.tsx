import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Archive,
  Clock3,
  FolderTree,
  GitBranch,
  Paintbrush,
  ScanSearch,
  Settings2,
  Sparkles,
  Unplug,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "@/i18n/translate";
import type { TranslationKey } from "@/i18n/messages";
import type { Locale } from "@/i18n/types";
import { localeSelectors, useLocaleStore } from "@/stores/localeStore";
import { useWorkspaceStore, workspaceSelectors } from "@/stores/workspaceStore";

type SettingsSectionId =
  | "general"
  | "configuration"
  | "personalization"
  | "mcpServers"
  | "git"
  | "environment"
  | "worktree"
  | "archivedThreads";

interface SettingsSection {
  id: SettingsSectionId;
  icon: LucideIcon;
  titleKey: TranslationKey;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "general", icon: Sparkles, titleKey: "settings.sectionGeneral" },
  { id: "configuration", icon: Clock3, titleKey: "settings.sectionConfiguration" },
  { id: "personalization", icon: Paintbrush, titleKey: "settings.sectionPersonalization" },
  { id: "mcpServers", icon: Unplug, titleKey: "settings.sectionMcpServers" },
  { id: "git", icon: GitBranch, titleKey: "settings.sectionGit" },
  { id: "environment", icon: Settings2, titleKey: "settings.sectionEnvironment" },
  { id: "worktree", icon: FolderTree, titleKey: "settings.sectionWorktree" },
  { id: "archivedThreads", icon: Archive, titleKey: "settings.sectionArchivedThreads" },
];

function getLocaleLabel(locale: Locale): TranslationKey {
  return locale === "zh-CN" ? "workspace.languageSimplifiedChinese" : "workspace.languageEnglish";
}

export function SettingsPage() {
  const locale = useLocaleStore(localeSelectors.locale);
  const currentProjectPath = useWorkspaceStore(workspaceSelectors.currentProjectPath);
  const navigate = useNavigate();
  const [selectedSectionId, setSelectedSectionId] = useState<SettingsSectionId>("general");
  const [isPreventSleepEnabled, setIsPreventSleepEnabled] = useState(false);
  const [isCommandEnterEnabled, setIsCommandEnterEnabled] = useState(false);
  const [followBehavior, setFollowBehavior] = useState<"queue" | "guide">("queue");

  const selectedSection = SETTINGS_SECTIONS.find((section) => section.id === selectedSectionId) ?? SETTINGS_SECTIONS[0];

  const backTarget = currentProjectPath ? "/workspace" : "/";

  const renderContent = () => {
    if (selectedSectionId !== "general") {
      return (
        <section className="settings-panel settings-placeholder-panel">
          <div className="settings-placeholder-copy">
            <ScanSearch className="settings-placeholder-icon" />
            <h2 className="settings-placeholder-title">{t(locale, selectedSection.titleKey)}</h2>
            <p className="settings-placeholder-text">{t(locale, "settings.sectionPlaceholder")}</p>
          </div>
        </section>
      );
    }

    return (
      <section className="settings-panel">
        <div className="settings-row">
          <div className="settings-row-copy">
            <h2 className="settings-row-title">{t(locale, "settings.defaultTargetTitle")}</h2>
            <p className="settings-row-description">{t(locale, "settings.defaultTargetDescription")}</p>
          </div>
          <div className="settings-pill">VS Code</div>
        </div>

        <div className="settings-row">
          <div className="settings-row-copy">
            <h2 className="settings-row-title">{t(locale, "workspace.language")}</h2>
            <p className="settings-row-description">{t(locale, "settings.languageDescription")}</p>
          </div>
          <div className="settings-segmented-control" role="group">
            {(["en", "zh-CN"] as const).map((nextLocale) => (
              <button
                className={`settings-segmented-option${locale === nextLocale ? " is-active" : ""}`}
                key={nextLocale}
                onClick={() => {
                  useLocaleStore.getState().setLocale(nextLocale);
                }}
                type="button"
              >
                {t(locale, getLocaleLabel(nextLocale))}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-copy">
            <h2 className="settings-row-title">{t(locale, "settings.threadDetailsTitle")}</h2>
            <p className="settings-row-description">{t(locale, "settings.threadDetailsDescription")}</p>
          </div>
          <div className="settings-pill">{t(locale, "settings.threadDetailsValue")}</div>
        </div>

        <div className="settings-row">
          <div className="settings-row-copy">
            <h2 className="settings-row-title">{t(locale, "settings.preventSleepTitle")}</h2>
            <p className="settings-row-description">{t(locale, "settings.preventSleepDescription")}</p>
          </div>
          <button
            aria-pressed={isPreventSleepEnabled}
            className={`settings-switch${isPreventSleepEnabled ? " is-active" : ""}`}
            onClick={() => {
              setIsPreventSleepEnabled((value) => !value);
            }}
            type="button"
          >
            <span className="settings-switch-thumb" />
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-copy">
            <h2 className="settings-row-title">{t(locale, "settings.commandEnterTitle")}</h2>
            <p className="settings-row-description">{t(locale, "settings.commandEnterDescription")}</p>
          </div>
          <button
            aria-pressed={isCommandEnterEnabled}
            className={`settings-switch${isCommandEnterEnabled ? " is-active" : ""}`}
            onClick={() => {
              setIsCommandEnterEnabled((value) => !value);
            }}
            type="button"
          >
            <span className="settings-switch-thumb" />
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-copy">
            <h2 className="settings-row-title">{t(locale, "settings.followBehaviorTitle")}</h2>
            <p className="settings-row-description">{t(locale, "settings.followBehaviorDescription")}</p>
          </div>
          <div className="settings-segmented-control" role="group">
            {(["queue", "guide"] as const).map((nextBehavior) => (
              <button
                className={`settings-segmented-option${followBehavior === nextBehavior ? " is-active" : ""}`}
                key={nextBehavior}
                onClick={() => {
                  setFollowBehavior(nextBehavior);
                }}
                type="button"
              >
                {t(locale, nextBehavior === "queue" ? "settings.followBehaviorQueue" : "settings.followBehaviorGuide")}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <main className="settings-layout">
      <aside className="settings-sidebar">
        <button
          className="settings-back-button"
          onClick={() => {
            navigate(backTarget);
          }}
          type="button"
        >
          <ArrowLeft className="settings-back-icon" />
          <span>{t(locale, "settings.backToApp")}</span>
        </button>

        <nav aria-label={t(locale, "workspace.settings")} className="settings-nav">
          {SETTINGS_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const isActive = section.id === selectedSectionId;

            return (
              <button
                className={`settings-nav-item${isActive ? " is-active" : ""}`}
                key={section.id}
                onClick={() => {
                  setSelectedSectionId(section.id);
                }}
                type="button"
              >
                <SectionIcon className="settings-nav-icon" />
                <span>{t(locale, section.titleKey)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="settings-main">
        <header className="settings-header">
          <h1 className="settings-title">{t(locale, selectedSection.titleKey)}</h1>
        </header>
        {renderContent()}
      </section>
    </main>
  );
}
