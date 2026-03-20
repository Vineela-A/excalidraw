import React, { useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { newStickynoteElement } from "@excalidraw/element";
import { COLOR_STICKYNOTE_YELLOW } from "@excalidraw/common";

// Miro-style sticky note colors
const STICKY_COLORS = [
  { label: "Yellow", value: COLOR_STICKYNOTE_YELLOW },
  { label: "Pink",   value: "#ffd6e7" },
  { label: "Blue",   value: "#cce5ff" },
  { label: "Green",  value: "#d4edda" },
  { label: "Lavender", value: "#e2d9f3" },
];

type Props = {
  api: ExcalidrawImperativeAPI | null;
};

const StickyNoteButton: React.FC<Props> = ({ api }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const addSticky = (color: string) => {
    if (!api) return;
    setPickerOpen(false);

    const appState = api.getAppState?.();
    const width = 200;
    const height = 150;

    let x = 100;
    let y = 100;

    if (appState) {
      const zoom = (appState.zoom && (appState.zoom as any).value) || 1;
      const viewW = window.innerWidth || 800;
      const viewH = window.innerHeight || 600;
      const scrollX = (appState as any).scrollX || 0;
      const scrollY = (appState as any).scrollY || 0;
      x = scrollX + viewW / zoom / 2 - width / 2;
      y = scrollY + viewH / zoom / 2 - height / 2;
    }

    const sticky = newStickynoteElement({
      text: "",
      x,
      y,
      width,
      height,
      backgroundColor: color,
    });

    const existing = api.getSceneElements?.() ?? [];
    api.updateScene({
      elements: [...existing, sticky],
      appState: { selectedElementIds: { [sticky.id]: true } as any },
    } as any);

    // Trigger text editing by dispatching a dblclick-like event on the element
    // after a short delay so the scene has updated
    setTimeout(() => {
      const ev = new CustomEvent("excalidraw:editStickynote", {
        detail: { id: sticky.id },
      });
      window.dispatchEvent(ev);
    }, 50);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="excalidraw-add-sticky"
        onClick={() => setPickerOpen((s) => !s)}
        title="Add sticky note"
      >
        Add Sticky
      </button>

      {pickerOpen && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: 8,
            display: "flex",
            gap: 8,
            zIndex: 10020,
          }}
        >
          {STICKY_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => addSticky(c.value)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: c.value,
                border: "2px solid rgba(0,0,0,0.12)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StickyNoteButton;
