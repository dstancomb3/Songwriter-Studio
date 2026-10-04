import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export type ContextMenuItem = {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function StudioContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    function close() {
      onClose();
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "mousedown",
      close
    );

    window.addEventListener(
      "blur",
      close
    );

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "mousedown",
        close
      );
      window.removeEventListener(
        "blur",
        close
      );
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  const viewportWidth =
    window.innerWidth;
  const viewportHeight =
    window.innerHeight;

  const left =
    Math.min(
      x,
      viewportWidth - 210
    );

  const top =
    Math.min(
      y,
      viewportHeight -
        Math.max(
          60,
          items.length * 34 +
            16
        )
    );

  return (
    <div
      ref={ref}
      className="studio-context-menu"
      style={{
        left:
          Math.max(8, left),
        top:
          Math.max(8, top),
      }}
      role="menu"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {items.map(
        (item) => (
          <button
            type="button"
            key={item.id}
            role="menuitem"
            disabled={
              item.disabled
            }
            className={
              item.danger
                ? "studio-context-menu__item studio-context-menu__item--danger"
                : "studio-context-menu__item"
            }
            onClick={() => {
              if (
                item.disabled
              ) {
                return;
              }

              item.onSelect();
              onClose();
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
