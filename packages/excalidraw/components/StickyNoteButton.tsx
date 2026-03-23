import React, { useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { newStickynoteElement } from "@excalidraw/element";

// 18 Miro-inspired sticky note colors (3 rows × 6 cols)
const STICKY_COLORS = [
  // Row 1 — vivid warm
  { label: "Yellow",       value: "#FFDD57" },
  { label: "Orange",       value: "#FF9F47" },
  { label: "Coral",        value: "#FF7B6B" },
  { label: "Red",          value: "#FF5252" },
  { label: "Pink",         value: "#FF5FA0" },
  { label: "Purple",       value: "#B884F7" },
  // Row 2 — vivid cool
  { label: "Violet",       value: "#6B76F0" },
  { label: "Blue",         value: "#3E85F3" },
  { label: "Sky",          value: "#57BEFF" },
  { label: "Teal",         value: "#00BFA5" },
  { label: "Green",        value: "#56D17E" },
  { label: "Lime",         value: "#B3D941" },
  // Row 3 — pastels / light
  { label: "Light Yellow", value: "#FFF9C4" },
  { label: "Light Orange", value: "#FFEACC" },
  { label: "Light Pink",   value: "#FFD6E8" },
  { label: "Light Blue",   value: "#D1EBFF" },
  { label: "Light Green",  value: "#D7F5E3" },
  { label: "Light Gray",   value: "#F0F0F0" },
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

    // Trigger text editing after scene update
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
        title="Add sticky note (S)"
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
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 6,
            width: 228,
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
                border: "2px solid rgba(0,0,0,0.10)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StickyNoteButton;
