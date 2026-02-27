import { t } from "@/i18n/translate";
import type { TranslationKey } from "@/i18n/messages";
import type { Locale } from "@/i18n/types";
import { formatRelativeOpenedAt } from "@/lib/time/formatRelativeOpenedAt";

export type ThreadTitleKey = Extract<TranslationKey, `workspace.mockThread.${string}`>;

export interface WorkspaceThread {
  id: string;
  titleKey: ThreadTitleKey;
  openedAt: number;
}

interface ThreadListProps {
  locale: Locale;
  selectedThreadId: string | null;
  threads: WorkspaceThread[];
  onSelect: (thread: WorkspaceThread) => void;
}

export function ThreadList(props: ThreadListProps) {
  return (
    <ul className="workspace-thread-list">
      {props.threads.map((thread) => {
        const isActive = props.selectedThreadId === thread.id;

        return (
          <li key={thread.id}>
            <button
              className={`workspace-thread-item${isActive ? " is-active" : ""}`}
              onClick={() => {
                props.onSelect(thread);
              }}
              type="button"
            >
              <span className="workspace-thread-title">{t(props.locale, thread.titleKey)}</span>
              <span className="workspace-thread-time">
                {formatRelativeOpenedAt(thread.openedAt, Date.now(), props.locale)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

