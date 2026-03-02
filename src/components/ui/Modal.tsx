import { type PropsWithChildren, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onRequestClose: () => void;
  className?: string;
  disableDismiss?: boolean;
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => !element.hasAttribute("hidden"));
}

export function Modal({ title, isOpen, onRequestClose, className, disableDismiss = false, children }: PropsWithChildren<ModalProps>) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);
    const initialFocus = focusableElements[0] ?? dialogRef.current;
    initialFocus.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disableDismiss) {
        event.preventDefault();
        onRequestClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const currentFocusableElements = getFocusableElements(dialogRef.current);

      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = currentFocusableElements[0];
      const last = currentFocusableElements[currentFocusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [disableDismiss, isOpen, onRequestClose]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    triggerRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (disableDismiss) {
          return;
        }

        if (event.target === event.currentTarget) {
          onRequestClose();
        }
      }}
    >
      <div
        aria-label={title}
        aria-modal="true"
        className={`modal-shell ${className ?? ""}`.trim()}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
