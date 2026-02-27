import { Languages, Settings } from "lucide-react";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";
import { IconButton } from "@/components/ui/IconButton";
import { MenuPanel } from "@/components/ui/MenuPanel";

interface SettingsMenuProps {
  isOpen: boolean;
  locale: Locale;
  onToggle: () => void;
  onSelectLocale: (locale: Locale) => void;
}

function getLocaleLabel(locale: Locale): "workspace.languageEnglish" | "workspace.languageSimplifiedChinese" {
  return locale === "zh-CN" ? "workspace.languageSimplifiedChinese" : "workspace.languageEnglish";
}

export function SettingsMenu(props: SettingsMenuProps) {
  return (
    <div className="workspace-settings-container">
      <button
        aria-expanded={props.isOpen}
        aria-haspopup="menu"
        className="workspace-settings-button"
        onClick={props.onToggle}
        type="button"
      >
        <span className="workspace-settings-button-content">
          <Settings className="settings-icon" />
          <span>{t(props.locale, "workspace.settings")}</span>
        </span>
      </button>

      {props.isOpen ? (
        <MenuPanel ariaLabel={t(props.locale, "workspace.settingsMenuAria")} className="workspace-settings-menu">
          <p className="workspace-settings-label">{t(props.locale, "workspace.language")}</p>
          <div className="workspace-locale-options">
            {(["en", "zh-CN"] as const).map((nextLocale) => (
              <IconButton
                className={`workspace-locale-option${props.locale === nextLocale ? " is-selected" : ""}`}
                key={nextLocale}
                label={t(props.locale, getLocaleLabel(nextLocale))}
                onClick={() => {
                  props.onSelectLocale(nextLocale);
                }}
                role="menuitemradio"
              >
                <Languages className="workspace-locale-icon" />
                <span>{t(props.locale, getLocaleLabel(nextLocale))}</span>
              </IconButton>
            ))}
          </div>
        </MenuPanel>
      ) : null}
    </div>
  );
}

