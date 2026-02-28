import { useEffect, useRef } from "react";
import { ArrowUp, ChevronDown, Mic, Plus, Sparkles } from "lucide-react";
import { MenuPanel } from "@/components/ui/MenuPanel";
import { t } from "@/i18n/translate";
import type { Locale } from "@/i18n/types";
import type { ThreadComposerPreset } from "@/components/workspace/mockWorkspaceThreads";

export type ThreadComposerMenuId = "effort" | "mode" | "model" | null;

interface ThreadComposerProps {
  draft: string;
  effort: ThreadComposerPreset["effort"];
  locale: Locale;
  mode: ThreadComposerPreset["mode"];
  model: ThreadComposerPreset["model"];
  onChangeDraft: (value: string) => void;
  onSelectEffort: (value: ThreadComposerPreset["effort"]) => void;
  onSelectMode: (value: ThreadComposerPreset["mode"]) => void;
  onSelectModel: (value: ThreadComposerPreset["model"]) => void;
  onToggleMenu: (menu: Exclude<ThreadComposerMenuId, null>) => void;
  openMenu: ThreadComposerMenuId;
}

function getEffortLabel(locale: Locale, effort: ThreadComposerPreset["effort"]): string {
  if (effort === "low") {
    return t(locale, "workspace.thread.effortLow");
  }

  if (effort === "medium") {
    return t(locale, "workspace.thread.effortMedium");
  }

  return t(locale, "workspace.thread.effortHigh");
}

export function ThreadComposer(props: ThreadComposerProps) {
  const { draft, effort, locale, mode, model, onChangeDraft, onSelectEffort, onSelectMode, onSelectModel, onToggleMenu, openMenu } =
    props;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
  }, [draft]);

  return (
    <div className="thread-composer-shell">
      <div className="thread-composer-card">
        <textarea
          aria-label={t(locale, "workspace.thread.promptAria")}
          className="thread-composer-textarea"
          onChange={(event) => {
            onChangeDraft(event.target.value);
          }}
          placeholder={t(locale, "workspace.thread.promptPlaceholder")}
          ref={textareaRef}
          rows={1}
          value={draft}
        />

        <div className="thread-composer-toolbar">
          <div className="thread-composer-toolbar-start">
            <button
              aria-label={t(locale, "workspace.thread.addAttachment")}
              className="thread-composer-icon-button"
              type="button"
            >
              <Plus className="thread-composer-icon" />
            </button>

            <div className="thread-composer-control">
              <button
                aria-label={model}
                aria-expanded={openMenu === "model"}
                aria-haspopup="menu"
                className="thread-composer-select-button"
                onClick={() => {
                  onToggleMenu("model");
                }}
                type="button"
              >
                <span>{model}</span>
                <ChevronDown className="thread-composer-chevron" />
              </button>

              {openMenu === "model" ? (
                <MenuPanel ariaLabel={t(locale, "workspace.thread.modelMenuAria")} className="thread-composer-menu">
                  {(["GPT-5.3-Codex", "GPT-5.3", "GPT-4.1"] as const).map((modelOption) => (
                    <button
                      className={`thread-panel-menu-item${model === modelOption ? " is-active" : ""}`}
                      key={modelOption}
                      onClick={() => {
                        onSelectModel(modelOption);
                      }}
                      type="button"
                    >
                      {modelOption}
                    </button>
                  ))}
                </MenuPanel>
              ) : null}
            </div>

            <div className="thread-composer-control">
              <button
                aria-label={getEffortLabel(locale, effort)}
                aria-expanded={openMenu === "effort"}
                aria-haspopup="menu"
                className="thread-composer-select-button"
                onClick={() => {
                  onToggleMenu("effort");
                }}
                type="button"
              >
                <span>{getEffortLabel(locale, effort)}</span>
                <ChevronDown className="thread-composer-chevron" />
              </button>

              {openMenu === "effort" ? (
                <MenuPanel ariaLabel={t(locale, "workspace.thread.effortMenuAria")} className="thread-composer-menu">
                  {(["low", "medium", "high"] as const).map((effortOption) => (
                    <button
                      className={`thread-panel-menu-item${effort === effortOption ? " is-active" : ""}`}
                      key={effortOption}
                      onClick={() => {
                        onSelectEffort(effortOption);
                      }}
                      type="button"
                    >
                      {getEffortLabel(locale, effortOption)}
                    </button>
                  ))}
                </MenuPanel>
              ) : null}
            </div>

            <span aria-hidden="true" className="thread-composer-divider" />

            <div className="thread-composer-control">
              <button
                aria-label={mode === "plan" ? t(locale, "workspace.thread.plan") : t(locale, "workspace.thread.chat")}
                aria-expanded={openMenu === "mode"}
                aria-haspopup="menu"
                className={`thread-composer-mode-button${mode === "plan" ? " is-active" : ""}`}
                onClick={() => {
                  onToggleMenu("mode");
                }}
                type="button"
              >
                <Sparkles className="thread-composer-mode-icon" />
                <span>{mode === "plan" ? t(locale, "workspace.thread.plan") : t(locale, "workspace.thread.chat")}</span>
              </button>

              {openMenu === "mode" ? (
                <MenuPanel ariaLabel={t(locale, "workspace.thread.modeMenuAria")} className="thread-composer-menu">
                  <button
                    className={`thread-panel-menu-item${mode === "plan" ? " is-active" : ""}`}
                    onClick={() => {
                      onSelectMode("plan");
                    }}
                    type="button"
                  >
                    {t(locale, "workspace.thread.plan")}
                  </button>
                  <button
                    className={`thread-panel-menu-item${mode === "chat" ? " is-active" : ""}`}
                    onClick={() => {
                      onSelectMode("chat");
                    }}
                    type="button"
                  >
                    {t(locale, "workspace.thread.chat")}
                  </button>
                </MenuPanel>
              ) : null}
            </div>
          </div>

          <div className="thread-composer-toolbar-end">
            <button
              aria-label={t(locale, "workspace.thread.voiceInput")}
              className="thread-composer-icon-button"
              type="button"
            >
              <Mic className="thread-composer-icon" />
            </button>

            <button
              aria-label={t(locale, "workspace.thread.send")}
              className="thread-composer-send-button"
              disabled
              type="button"
            >
              <ArrowUp className="thread-composer-send-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
