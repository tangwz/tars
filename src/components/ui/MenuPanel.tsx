import type { PropsWithChildren } from "react";

interface MenuPanelProps {
  ariaLabel: string;
  className?: string;
}

export function MenuPanel({ ariaLabel, className, children }: PropsWithChildren<MenuPanelProps>) {
  return (
    <section aria-label={ariaLabel} className={`menu-panel ${className ?? ""}`.trim()} role="menu">
      {children}
    </section>
  );
}

