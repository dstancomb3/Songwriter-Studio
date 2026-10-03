import type {
  PropsWithChildren,
  ReactNode,
} from "react";

interface PanelProps
  extends PropsWithChildren {
  title: string;
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  headerRight?: ReactNode;
}

export function Panel({
  title,
  collapsible = false,
  isCollapsed = false,
  onToggleCollapse,
  headerRight,
  children,
}: PanelProps) {
  return (
    <div className="app-panel">
      <div
        className="app-panel__header"
        onClick={
          collapsible
            ? onToggleCollapse
            : undefined
        }
        style={{
          cursor: collapsible
            ? "pointer"
            : "default",
        }}
      >
        <span>{title}</span>

        <div className="app-panel__header-actions">
          {headerRight && (
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              {headerRight}
            </div>
          )}

          {collapsible && (
            <span
              onClick={onToggleCollapse}
              style={{
                fontSize: "1rem",
                lineHeight: 1,
                cursor: "pointer",
                color: "#aab3c7",
              }}
            >
              {isCollapsed ? "▸" : "▾"}
            </span>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="app-panel__body">
          {children}
        </div>
      )}
    </div>
  );
}
