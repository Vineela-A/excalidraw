import React, { useMemo } from "react";
import { useExcalidrawElements, useExcalidrawAppState, useApp } from "./App";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { getElementAbsoluteCoords } from "@excalidraw/element";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

const badgeSize = 28;

const ReactionsOverlay: React.FC = () => {
  const elements = useExcalidrawElements();
  const appState = useExcalidrawAppState();
  const app = useApp();

  const elementsMap = useMemo(() => new Map(elements.map((e) => [e.id, e])), [elements]);

  const items = elements.filter((el) => el.customData && el.customData.reactions);

  if (!items.length) return null;

  return (
    <>
      {items.map((el: NonDeletedExcalidrawElement) => {
        const reactions = el.customData?.reactions as Record<string, { users: string[] }> | undefined;
        if (!reactions) return null;

        const [absX, absY] = getElementAbsoluteCoords(el, elementsMap as any);
        const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
          { sceneX: absX + el.width, sceneY: absY + el.height },
          appState,
        );

        const left = viewportX - appState.offsetLeft;
        const top = viewportY - appState.offsetTop;

        const reactionEntries = Object.entries(reactions);

        return (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${left}px`,
              top: `${top}px`,
              transform: `translate(6px, -18px)`,
              display: "flex",
              gap: 6,
              pointerEvents: "none",
              zIndex: 10001,
            }}
          >
            {reactionEntries.map(([emoji, { users }]) => (
              <div
                key={emoji}
                style={{
                  minWidth: badgeSize,
                  height: badgeSize,
                  background: "white",
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  fontSize: 14,
                  padding: "0 8px",
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
                onClick={() => {
                  // Emit event for external handling; mutation should be done by host
                  const ev = new CustomEvent("excalidraw:toggleReaction", {
                    detail: { elementId: el.id, emoji },
                  });
                  window.dispatchEvent(ev);
                }}
                title={`${users.length} reaction${users.length === 1 ? "" : "s"}: ${emoji}`}
              >
                <span style={{ marginRight: 6 }}>{emoji}</span>
                <span style={{ fontSize: 12, color: "#333" }}>{users.length}</span>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};

export default ReactionsOverlay;
