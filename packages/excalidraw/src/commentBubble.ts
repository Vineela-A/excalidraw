import type { CSSProperties } from "react";
import { COMMENT_FONT_FAMILY } from "./commentConstants";

export const bubbleBaseStyle: CSSProperties = {
  background: "white",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 12px 40px rgba(16,24,40,0.12)",
  pointerEvents: "auto",
  color: "#111",
  fontFamily: COMMENT_FONT_FAMILY,
};

export function bubblePopoverStyle(width?: number | string, minWidth?: number | string, maxWidth?: string): CSSProperties {
  return {
    ...bubbleBaseStyle,
    ...(typeof width !== "undefined" ? { width } : {}),
    ...(typeof minWidth !== "undefined" ? { minWidth } : {}),
    ...(typeof maxWidth !== "undefined" ? { maxWidth } : {}),
  };
}

// Apply bubble-like styles to a DOM element (used by dev helpers)
export function applyBubbleStyles(el: HTMLElement, opts?: { width?: string; maxWidth?: string; padding?: string }) {
  el.style.background = "white";
  el.style.border = "1px solid rgba(0,0,0,0.08)";
  el.style.borderRadius = "12px";
  el.style.padding = opts?.padding ?? "8px";
  el.style.boxShadow = "0 12px 40px rgba(16,24,40,0.12)";
  el.style.pointerEvents = "auto";
  el.style.color = "#111";
  el.style.fontFamily = COMMENT_FONT_FAMILY;
  if (opts?.width) el.style.width = opts.width;
  if (opts?.maxWidth) el.style.maxWidth = opts.maxWidth;
}

export default bubbleBaseStyle;
