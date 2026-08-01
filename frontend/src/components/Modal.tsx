import { useCallback, useEffect, useState, type ReactNode } from "react";

interface Props {
  title: string;
  onClose: () => void;
  /** children receive an animated `close()` — call it instead of onClose
   *  so every dismissal (buttons included) plays the fade-out. */
  children: (close: () => void) => ReactNode;
}

const ANIM_MS = 200;

export function Modal({ title, onClose, children }: Props) {
  const [open, setOpen] = useState(false);

  const requestClose = useCallback(() => {
    setOpen(false);
    window.setTimeout(onClose, ANIM_MS); // unmount only after the fade-out
  }, [onClose]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(true)); // trigger fade-in
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [requestClose]);

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : ""}`}
      onClick={requestClose}
    >
      <div
        className={`modal ${open ? "modal--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h3 className="modal__title">{title}</h3>
          <button
            className="iconbtn"
            onClick={requestClose}
            aria-label="Close"
            title="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="modal__body">{children(requestClose)}</div>
      </div>
    </div>
  );
}
