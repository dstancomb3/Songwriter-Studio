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
    <div
      style={{
        background: "#27272a",

        border:
          "1px solid #3f3f46",

        borderRadius: "9px",

        display: "flex",

        flexDirection: "column",

        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding:
            "0.675rem 0.75rem",

          borderBottom:
            "1px solid #3f3f46",

          fontWeight: 700,

          fontSize: "0.8rem",

          color: "#fafafa",

          background:
            "#313134",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: collapsible
            ? "pointer"
            : "default",
        }}
        onClick={
          collapsible
            ? onToggleCollapse
            : undefined
        }
      >
        <span>{title}</span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {headerRight && (
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {headerRight}
            </div>
          )}

          {collapsible && (
            <span
              onClick={onToggleCollapse}
              style={{
                fontSize: "1.25rem",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              {isCollapsed ? "▸" : "▾"}
            </span>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "0.75rem",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}