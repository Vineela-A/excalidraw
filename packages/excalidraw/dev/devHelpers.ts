// Dev helpers for local debugging in the main app
/* eslint-disable no-console */

// ─── Dev Log Utilities ────────────────────────────────────────────────────────
// Lightweight in-memory log ring exposed on window for console inspection.
// Usage: window.getExcalidrawDevLogs()

function initDevHelpers() {
  if (typeof window === "undefined") return;
  const w = window as any;

  if (!w.__excalidrawDevLogs) {
    w.__excalidrawDevLogs = [] as string[];
  }

  if (!w.__pushExcalidrawDevLog) {
    w.__pushExcalidrawDevLog = (s: string) => {
      w.__excalidrawDevLogs.push(`${new Date().toLocaleTimeString()}: ${s}`);
      if (w.__excalidrawDevLogs.length > 50) w.__excalidrawDevLogs.shift();
    };
  }

  if (!w.getExcalidrawDevLogs) {
    w.getExcalidrawDevLogs = () => (w.__excalidrawDevLogs as string[]).slice().reverse();
  }

  if (!w.clearExcalidrawDevLogs) {
    w.clearExcalidrawDevLogs = () => {
      w.__excalidrawDevLogs = [];
    };
  }
}

initDevHelpers();

export default null;
