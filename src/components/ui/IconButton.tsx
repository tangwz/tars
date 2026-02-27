import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
}

export function IconButton({ className, label, children, ...props }: PropsWithChildren<IconButtonProps>) {
  return (
    <button aria-label={label} className={`icon-button ${className ?? ""}`.trim()} type="button" {...props}>
      {children}
    </button>
  );
}
