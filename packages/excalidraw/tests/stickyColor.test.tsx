import React from "react";

import { COLOR_STICKYNOTE_YELLOW, resolvablePromise } from "@excalidraw/common";

import { Excalidraw } from "../index";

import { Pointer } from "./helpers/ui";
import { act, render } from "./test-utils";

import type { ExcalidrawImperativeAPI } from "../types";

describe("new sticky note colour", () => {
  const h = window.h;
  const mouse = new Pointer("mouse");
  let excalidrawAPI: ExcalidrawImperativeAPI;

  beforeEach(async () => {
    const apiPromise = resolvablePromise<ExcalidrawImperativeAPI>();
    await render(
      <Excalidraw onExcalidrawAPI={(api) => apiPromise.resolve(api as any)} />,
    );
    excalidrawAPI = await apiPromise;
  });

  const drawNote = () => {
    act(() => {
      excalidrawAPI.setActiveTool({ type: "stickynote" });
    });
    mouse.reset();
    mouse.down(100, 100);
    mouse.up(220, 220);
  };

  it("defaults to the standard yellow", () => {
    expect(h.state.currentItemStickyColor).toBe(COLOR_STICKYNOTE_YELLOW);
    drawNote();
    const note = h.elements.find((el) => el.type === "stickynote");
    expect(note?.backgroundColor).toBe(COLOR_STICKYNOTE_YELLOW);
  });

  it("uses the colour set for new sticky notes", () => {
    act(() => {
      excalidrawAPI.updateScene({
        appState: { currentItemStickyColor: "#ffd1e3" },
      });
    });
    drawNote();
    const note = h.elements.find((el) => el.type === "stickynote");
    expect(note?.backgroundColor).toBe("#ffd1e3");
  });

  it("does not change the fill of new shapes", () => {
    act(() => {
      excalidrawAPI.updateScene({
        appState: { currentItemStickyColor: "#ffd1e3" },
      });
      excalidrawAPI.setActiveTool({ type: "rectangle" });
    });
    mouse.reset();
    mouse.down(100, 100);
    mouse.up(220, 220);
    const rect = h.elements.find((el) => el.type === "rectangle");
    expect(rect?.backgroundColor).toBe(h.state.currentItemBackgroundColor);
    expect(rect?.backgroundColor).not.toBe("#ffd1e3");
  });
});
