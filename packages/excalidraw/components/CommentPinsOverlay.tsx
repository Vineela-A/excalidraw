import React, { useMemo } from "react";
import { useExcalidrawElements, useExcalidrawAppState } from "./App";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { getElementAbsoluteCoords } from "@excalidraw/element";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

/**
 * Lightweight comment pins overlay.
 * NOTE: Comments should be stored outside elements (see design).
 * This component renders placeholder pins for elements that have
 * `customData.commentPin === true` to demonstrate pin placement.
 * Integrators should pass real comment threads from external store
 * (or expose via window events) and render them similarly.
 */

const PinSize = 28;

const CommentPinsOverlay: React.FC = () => {
  const elements = useExcalidrawElements();
  const appState = useExcalidrawAppState();

  const elementsMap = useMemo(() => new Map(elements.map((e) => [e.id, e])), [elements]);

  const pinned = elements.filter((el) => el.customData && el.customData.commentPin);

  if (!pinned.length) return null;

  return (
    <>
      {pinned.map((el: NonDeletedExcalidrawElement) => {
        const [absX, absY] = getElementAbsoluteCoords(el, elementsMap as any);
        const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
          { sceneX: absX + el.width, sceneY: absY + el.height },
          appState,
        );

        const left = viewportX - appState.offsetLeft;
        const top = viewportY - appState.offsetTop;

        return (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${left}px`,
              top: `${top}px`,
              transform: `translate(8px, -24px)`,
              zIndex: 10000,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                width: PinSize,
                height: PinSize,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ff4d4f",
                fontWeight: 600,
              }}
              title="Open comment thread"
              onClick={() => {
                const ev = new CustomEvent("excalidraw:openCommentThread", {
                  detail: { elementId: el.id },
                });
                window.dispatchEvent(ev);
              }}
            >
              💬
            </div>
          </div>
        );
      })}
    </>
  );
};

export default CommentPinsOverlay;
