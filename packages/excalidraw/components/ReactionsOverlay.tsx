import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useExcalidrawElements, useExcalidrawAppState, useAppProps } from "./App";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { getElementAbsoluteCoords } from "@excalidraw/element";
import { COMMENT_ACCENT_COLOR, COMMENT_FONT_SIZE_MD, COMMENT_FONT_SIZE_SM, SMILE_PLUS_SVG } from "../src/commentConstants";
import EmojiPicker from "./EmojiPicker";
import type { ElementReaction } from "../types";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

const BADGE_SIZE = 26;

const ReactionsOverlay: React.FC = () => {
  const elements = useExcalidrawElements();
  const appState = useExcalidrawAppState();
  const { reactions, onReactionToggle, currentUser } = useAppProps();
  const [pickerForElement, setPickerForElement] = useState<string | null>(null);
  const addBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const userId = currentUser?.id ?? "anon";

  if (!reactions || reactions.length === 0) {
    // Still render an "add reaction" button if any elements are selected — omit for now
    // Return null when there's nothing to show
    return null;
  }

  const elementsMap = new Map<string, NonDeletedExcalidrawElement>(
    elements.map((e) => [e.id, e]),
  );

  // Group reactions by elementId
  const byElement = new Map<string, ElementReaction[]>();
  for (const r of reactions) {
    const arr = byElement.get(r.elementId) ?? [];
    arr.push(r);
    byElement.set(r.elementId, arr);
  }

  return (
    <>
      {Array.from(byElement.entries()).map(([elementId, elementReactions]) => {
        const el = elementsMap.get(elementId);
        if (!el) return null;

        const [absX, absY] = getElementAbsoluteCoords(el, elementsMap as any);
        const { x: vpX, y: vpY } = sceneCoordsToViewportCoords(
          { sceneX: absX + el.width, sceneY: absY + el.height },
          appState,
        );
        const left = vpX - appState.offsetLeft + 6;
        const top = vpY - appState.offsetTop - BADGE_SIZE / 2;

        return (
          <div
            key={elementId}
            style={{
              position: "absolute",
              left,
              top,
              display: "flex",
              alignItems: "center",
              gap: 4,
              pointerEvents: "auto",
              zIndex: 10001,
            }}
          >
            {/* Reaction badges */}
            {elementReactions.map((r: ElementReaction) => {
              const isMine = r.userIds.includes(userId);
              return (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onReactionToggle?.(elementId, r.emoji, userId)}
                  title={`${r.count} reaction${r.count === 1 ? "" : "s"}${isMine ? " (you reacted)" : ""}`}
                  style={{
                    height: BADGE_SIZE,
                    minWidth: BADGE_SIZE,
                    padding: "0 8px",
                    borderRadius: 99,
                    border: `1px solid ${isMine ? COMMENT_ACCENT_COLOR : "#E5E7EB"}`,
                    background: isMine ? "#EFF6FF" : "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    fontSize: COMMENT_FONT_SIZE_MD,
                  }}
                >
                  <span>{r.emoji}</span>
                  <span style={{ fontSize: COMMENT_FONT_SIZE_SM, color: "#374151", fontWeight: 600 }}>{r.count}</span>
                </button>
              );
            })}

            {/* Add reaction button */}
            <button
              ref={(el) => { addBtnRefs.current[elementId] = el; }}
              type="button"
              onClick={() => setPickerForElement((s) => (s === elementId ? null : elementId))}
              aria-label="Add reaction"
              style={{
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                borderRadius: 99,
                border: "1px solid #E5E7EB",
                background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: SMILE_PLUS_SVG }} style={{ display: "inline-flex", width: 16, height: 16 }} />
            </button>

            {/* Emoji picker for this element */}
            {pickerForElement === elementId && addBtnRefs.current[elementId] &&
              createPortal(
                <EmojiPicker
                  anchorEl={addBtnRefs.current[elementId]!}
                  onSelect={(emoji) => {
                    onReactionToggle?.(elementId, emoji, userId);
                    setPickerForElement(null);
                  }}
                  onClose={() => setPickerForElement(null)}
                />,
                document.body,
              )
            }
          </div>
        );
      })}
    </>
  );
};

export default ReactionsOverlay;
