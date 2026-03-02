import React from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { newElement } from "@excalidraw/element";
import {
  DEFAULT_ELEMENT_PROPS,
  COLOR_STICKYNOTE_YELLOW,
  getLineHeight,
  DEFAULT_FONT_FAMILY,
} from "@excalidraw/common";

type Props = {
  api: ExcalidrawImperativeAPI | null;
};

// Helper to create a sticky as a rectangle + text grouped together.
const createStickyPair = (
  x: number,
  y: number,
  width = 200,
  height = 150,
  text = "",
) => {
  const rect = {
    ...newElement({ type: "rectangle", x, y, width, height } as any),
    backgroundColor: COLOR_STICKYNOTE_YELLOW,
    strokeColor: DEFAULT_ELEMENT_PROPS.strokeColor,
    strokeWidth: 1,
    roundness: 8,
  } as any;

  const fontSize = 16;
  const lineHeight = getLineHeight(DEFAULT_FONT_FAMILY as any);

  const txt = {
    ...newElement({ type: "text", x: x + 12, y: y + 12, width: width - 24, height: height - 24 } as any),
    text,
    fontSize,
    textAlign: "left",
    verticalAlign: "top",
    backgroundColor: "transparent",
    originalText: text,
    autoResize: false,
    lineHeight,
  } as any;

  // groupIds are used to group elements; create a shared group id
  const groupId = `sticky-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  rect.groupIds = [groupId];
  txt.groupIds = [groupId];

  return { rect, txt };
};

const StickyNoteButton: React.FC<Props> = ({ api }) => {
  const handleAdd = () => {
    if (!api) return;
    // compute a center position in scene coordinates using current app state
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
      x = scrollX + (viewW / zoom) / 2 - width / 2;
      y = scrollY + (viewH / zoom) / 2 - height / 2;
    }

    const { rect, txt } = createStickyPair(x, y, width, height);

    // append the new elements to the scene and select them as a group
    api.updateScene({ elements: [...(api.getSceneElements?.() ?? []), rect, txt], appState: { selectedElementIds: { [rect.id]: true, [txt.id]: true } as any } } as any);
  };

  return (
    <button type="button" onClick={handleAdd} className="excalidraw-add-sticky">
      Add Sticky Note
    </button>
  );
};

export default StickyNoteButton;
