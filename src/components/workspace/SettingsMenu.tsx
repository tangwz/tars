import { useEffect, useRef } from "react";
import { ChevronRight, CircleUserRound, Globe, Settings } from "lucide-react";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";
import { MenuPanel } from "@/components/ui/MenuPanel";

interface SettingsMenuProps {
  isOpen: boolean;
  locale: Locale;
  onToggle: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function SettingsMenu(props: SettingsMenuProps) {
  const { isOpen, locale, onClose, onOpenSettings, onToggle } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className="workspace-settings-container" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`workspace-settings-button${isOpen ? " is-active" : ""}`}
        onClick={onToggle}
        type="button"
      >
        <span className="workspace-settings-button-content">
          <Settings className="settings-icon" />
          <span>{t(locale, "workspace.settings")}</span>
        </span>
      </button>

      {isOpen ? (
        <MenuPanel ariaLabel={t(locale, "workspace.settingsMenuAria")} className="workspace-settings-menu">
          <div className="workspace-settings-account">
            <CircleUserRound className="workspace-settings-menu-icon" />
            <div className="workspace-settings-account-copy">
              <span className="workspace-settings-account-label">{t(locale, "workspace.accountLabel")}</span>
              <span className="workspace-settings-account-value">{t(locale, "workspace.accountSummary")}</span>
            </div>
          </div>

          <div aria-hidden="true" className="workspace-settings-divider" />

          <button
            className="workspace-settings-menu-item"
            onClick={onOpenSettings}
            role="menuitem"
            type="button"
          >
            <span className="workspace-settings-menu-item-main">
              <Settings className="workspace-settings-menu-icon" />
              <span>{t(locale, "workspace.settings")}</span>
            </span>
            <ChevronRight className="workspace-settings-menu-arrow" />
          </button>

          <button
            className="workspace-settings-menu-item"
            onClick={onOpenSettings}
            role="menuitem"
            type="button"
          >
            <span className="workspace-settings-menu-item-main">
              <Globe className="workspace-settings-menu-icon" />
              <span>{t(locale, "workspace.language")}</span>
            </span>
            <ChevronRight className="workspace-settings-menu-arrow" />
          </button>
        </MenuPanel>
      ) : null}
    </div>
  );
}
