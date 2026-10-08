import React from "react";

import { resolvablePromise } from "@excalidraw/common";

import { Excalidraw } from "../index";

import { Pointer } from "./helpers/ui";
import { act, render } from "./test-utils";

import type { ExcalidrawImperativeAPI, NormalizedZoomValue } from "../types";

describe("new sticky note size follows zoom", () => {
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

  const drawNoteAtZoom = (zoom: number) => {
    act(() => {
      excalidrawAPI.updateScene({
        appState: { zoom: { value: zoom as NormalizedZoomValue } },
      });
      excalidrawAPI.setActiveTool({ type: "stickynote" });
    });
    mouse.reset();
    mouse.moveTo(100, 100);
    mouse.down();
    mouse.up();
    return h.elements.find((el) => el.type === "stickynote") as any;
  };

  it("creates a 100 unit note at 100% zoom", () => {
    const note = drawNoteAtZoom(1);
    expect(note.width).toBe(100);
    expect(note.height).toBe(100);
    expect(note.fontSize).toBe(14);
  });

  it("creates a larger note when zoomed out", () => {
    const note = drawNoteAtZoom(0.5);
    expect(note.width).toBe(200);
    expect(note.height).toBe(200);
    expect(note.fontSize).toBe(28);
  });

  it("creates a smaller note, floored, when zoomed in", () => {
    const note = drawNoteAtZoom(4);
    expect(note.width).toBe(50);
    expect(note.fontSize).toBe(10);
  });
});
