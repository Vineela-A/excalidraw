import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { newTextElement } from "@excalidraw/element";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import {
  useExcalidrawElements,
  useExcalidrawAppState,
  useApp,
} from "./App";
import FullEmojiPicker from "./FullEmojiPicker";

const isEmojiSticker = (el: any): boolean => {
  if (el.type !== "text") return false;
  if (el.customData?.isEmojiSticker) return true;
  if ((el.fontSize ?? 0) < 30) return false;
  try {
    const segs = [...new Intl.Segmenter().segment(el.text ?? "")];
    return segs.length === 1;
  } catch {
    return false;
  }
};

const TrashSVG = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const TOOLBAR_H = 36;
const BTN: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: TOOLBAR_H,
  padding: "0 10px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#374151",
  fontSize: 13,
  fontFamily: "system-ui, sans-serif",
  gap: 6,
  flexShrink: 0,
  whiteSpace: "nowrap",
};
const DIVIDER: React.CSSProperties = {
  width: 1,
  height: 18,
  background: "rgba(0,0,0,0.1)",
  flexShrink: 0,
  alignSelf: "center",
};

const EmojiStickerOverlay: React.FC = () => {
  const elements = useExcalidrawElements();
  const appState = useExcalidrawAppState();
  const app = useApp();

  const emojiPickerBtnRef = useRef<HTMLButtonElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedIds = Object.keys(appState.selectedElementIds ?? {}).filter(
    (id) => (appState.selectedElementIds as any)[id],
  );
  if (selectedIds.length !== 1) return null;

  const el = elements.find((e) => e.id === selectedIds[0]);
  if (!el || !isEmojiSticker(el)) return null;

  const elAny = el as any;
  const { x: vpLeft, y: vpTop } = sceneCoordsToViewportCoords(
    { sceneX: elAny.x, sceneY: elAny.y },
    appState,
  );
  const { x: vpRight, y: vpBottom } = sceneCoordsToViewportCoords(
    { sceneX: elAny.x + (elAny.width ?? 50), sceneY: elAny.y + (elAny.height ?? 50) },
    appState,
  );

  const containerLeft = vpLeft - appState.offsetLeft;
  const elTop = vpTop - appState.offsetTop;
  const elBottom = vpBottom - appState.offsetTop;
  const toolbarTop = elTop > TOOLBAR_H + 12 ? elTop - TOOLBAR_H - 8 : elBottom + 8;

  const handleEmojiAdd = (emoji: string) => {
    setPickerOpen(false);
    app.onInsertElements([
      newTextElement({
        x: 0,
        y: 0,
        text: emoji,
        fontSize: 40,
        opacity: 100,
        customData: { isEmojiSticker: true },
      }),
    ]);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    const allElements = app.scene.getElementsIncludingDeleted();
    app.scene.replaceAllElements(
      allElements.filter((e: any) => e.id !== elAny.id),
    );
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: containerLeft,
          top: toolbarTop,
          zIndex: 10050,
          display: "inline-flex",
          alignItems: "center",
          height: TOOLBAR_H,
          background: "#fff",
          borderRadius: TOOLBAR_H / 2,
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          border: "1px solid #E5E7EB",
          pointerEvents: "auto",
          userSelect: "none",
          overflow: "visible",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          ref={emojiPickerBtnRef}
          type="button"
          style={{ ...BTN, paddingLeft: 12, paddingRight: 14 }}
          onClick={(e) => {
            e.stopPropagation();
            setPickerOpen((v) => !v);
            setMenuOpen(false);
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{elAny.text}</span>
          <span style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>View all emojis</span>
        </button>

        <div style={DIVIDER} />

        <button
          type="button"
          title="More options"
          style={{ ...BTN, paddingRight: 12, fontSize: 18, letterSpacing: 1, color: "#6B7280" }}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
            setPickerOpen(false);
          }}
        >
          •••
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: TOOLBAR_H + 6,
              right: 0,
              minWidth: 140,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid #E5E7EB",
              zIndex: 10051,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "system-ui, sans-serif",
                color: "#EF4444",
                textAlign: "left",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#FEF2F2")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              {TrashSVG}
              Delete
            </button>
          </div>
        )}
      </div>

      {pickerOpen && emojiPickerBtnRef.current &&
        createPortal(
          <FullEmojiPicker
            anchorEl={emojiPickerBtnRef.current}
            onSelect={handleEmojiAdd}
            onClose={() => setPickerOpen(false)}
          />,
          document.body,
        )
      }
    </>
  );
};

export default EmojiStickerOverlay;
