import type { Locale } from "@/i18n/types";
import { formatRelativeOpenedAt } from "@/lib/time/formatRelativeOpenedAt";

export interface WorkspaceThreadSummary {
  id: string;
  title: string;
  openedAt: number;
}

interface ThreadListProps {
  locale: Locale;
  selectedThreadId: string | null;
  threads: WorkspaceThreadSummary[];
  onSelect: (thread: WorkspaceThreadSummary) => void;
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
              <span className="workspace-thread-title">{thread.title}</span>
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
