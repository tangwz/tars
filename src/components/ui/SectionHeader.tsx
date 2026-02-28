import type { PropsWithChildren, ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
  actionsClassName?: string;
}

export function SectionHeader({
  title,
  actions,
  className,
  actionsClassName,
  children,
}: PropsWithChildren<SectionHeaderProps>) {
  return (
    <header className={`section-header ${className ?? ""}`.trim()}>
      <div className="section-header-main">
        <h1 className="section-header-title">{title}</h1>
        {children}
      </div>
      {actions ? <div className={`section-header-actions ${actionsClassName ?? ""}`.trim()}>{actions}</div> : null}
    </header>
  );
}
