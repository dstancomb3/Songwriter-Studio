import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

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

  const [
    position,
    setPosition,
  ] = useState({
    left: x,
    top: y,
  });

  useLayoutEffect(() => {
    const element =
      ref.current;

    if (!element) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    const padding = 8;

    const left =
      Math.max(
        padding,
        Math.min(
          x,
          window.innerWidth -
            rect.width -
            padding
        )
      );

    const top =
      Math.max(
        padding,
        Math.min(
          y,
          window.innerHeight -
            rect.height -
            padding
        )
      );

    setPosition({
      left,
      top,
    });
  }, [
    x,
    y,
    items.length,
  ]);

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
      "pointerdown",
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
        "pointerdown",
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

  return createPortal(
    <div
      ref={ref}
      className="studio-context-menu"
      style={{
        left:
          position.left,
        top:
          position.top,
      }}
      role="menu"
      onPointerDown={(event) =>
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
    </div>,
    document.body
  );
}
