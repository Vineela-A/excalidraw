import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Use package source styles so Vite resolves the local CSS/SCSS correctly
import "@excalidraw/excalidraw/css/styles.scss";

import type * as TExcalidraw from "@excalidraw/excalidraw";
// Import the runtime lib so we only load it once and expose to window
import * as ExcalidrawLib from "@excalidraw/excalidraw";

import App from "./components/ExampleApp";

declare global {
  interface Window {
    ExcalidrawLib: typeof TExcalidraw;
  }
}

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
// expose the imported lib on window for the example to consume
window.ExcalidrawLib = ExcalidrawLib as any;
const { Excalidraw } = window.ExcalidrawLib;
root.render(
  <StrictMode>
    <App
      appTitle={"Excalidraw Example"}
      useCustom={(api: any, args?: any[]) => {}}
      excalidrawLib={window.ExcalidrawLib}
    >
      <Excalidraw />
    </App>
  </StrictMode>,
);
