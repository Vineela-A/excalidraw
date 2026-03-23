import React from "react";
import { useExcalidrawElements, useExcalidrawAppState, useAppProps } from "./App";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { getElementAbsoluteCoords } from "@excalidraw/element";
import { COMMENT_ACCENT_COLOR } from "../src/commentConstants";
import type { Vote } from "../types";

const DOT_SIZE = 18;
const MAX_DOTS = 9;

const VoteOverlay: React.FC = () => {
  const elements = useExcalidrawElements();
  const appState = useExcalidrawAppState();
  const { votes, onVote, currentUser } = useAppProps();

  const userId = currentUser?.id ?? "anon";
  const userColor = currentUser?.avatarColor ?? COMMENT_ACCENT_COLOR;

  // Only render on stickynote elements
  const stickies = elements.filter((el) => el.type === "stickynote" && !el.isDeleted);
  if (stickies.length === 0) return null;

  // Group votes by elementId
  const votesByElement = new Map<string, Vote[]>();
  for (const v of votes ?? []) {
    const arr = votesByElement.get(v.elementId) ?? [];
    arr.push(v);
    votesByElement.set(v.elementId, arr);
  }

  const elementsMap = new Map(elements.map((e) => [e.id, e]));

  return (
    <>
      {stickies.map((el) => {
        const elVotes = votesByElement.get(el.id) ?? [];
        const iVoted = elVotes.some((v) => v.userId === userId);

        // Get bottom-centre viewport position
        const [absX1, , absX2, absY2] = getElementAbsoluteCoords(el, elementsMap as any);
        const midX = (absX1 + absX2) / 2;
        const { x: vpX, y: vpY } = sceneCoordsToViewportCoords(
          { sceneX: midX, sceneY: absY2 },
          appState,
        );
        const centerX = vpX - appState.offsetLeft;
        const bottomY = vpY - appState.offsetTop;

        const visibleDots = elVotes.slice(0, MAX_DOTS);
        const overflow = elVotes.length - MAX_DOTS;

        // Total width: dots + overflow label + vote button
        // Centred under the sticky note
        return (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: centerX,
              top: bottomY + 6,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 3,
              pointerEvents: "auto",
              zIndex: 10002,
            }}
          >
            {/* Existing vote dots */}
            {visibleDots.map((v) => (
              <div
                key={v.id}
                title={v.userId === userId ? "Your vote" : `Vote by ${v.userId}`}
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  borderRadius: DOT_SIZE / 2,
                  background: v.color,
                  border: "2px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                  flexShrink: 0,
                }}
              />
            ))}

            {/* Overflow indicator */}
            {overflow > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: "#555",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                +{overflow}
              </span>
            )}

            {/* Add / remove vote button */}
            <button
              type="button"
              onClick={() => onVote?.(el.id, userId, userColor)}
              title={iVoted ? "Remove your vote" : "Vote for this sticky"}
              style={{
                width: DOT_SIZE + 2,
                height: DOT_SIZE + 2,
                borderRadius: (DOT_SIZE + 2) / 2,
                border: `2px solid ${iVoted ? userColor : "#C0C0C0"}`,
                background: iVoted ? userColor : "rgba(255,255,255,0.92)",
                color: iVoted ? "#fff" : "#888",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                padding: 0,
              }}
            >
              {iVoted ? "✓" : "+"}
            </button>
          </div>
        );
      })}
    </>
  );
};

export default VoteOverlay;
