import React, { useState, useEffect, useRef } from "react";
import {
  useExcalidrawElements,
  useExcalidrawAppState,
  useAppProps,
} from "./App";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { SMILE_PLUS_SVG } from "../src/commentConstants";

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "✅", "🚀", "😂", "😮", "😢", "🎉", "💯"];
const COLLAPSED_SHOW = 5;

const PILL_H = 34;
const RADIUS = PILL_H / 2;
const SHADOW = "0 2px 8px rgba(0,0,0,0.13)";
const DIVIDER: React.CSSProperties = {
  width: 1, height: 18, background: "rgba(0,0,0,0.1)",
  flexShrink: 0, alignSelf: "center",
};

const StickyReactionBar: React.FC = () => {
  const elements = useExcalidrawElements();
  const appState = useExcalidrawAppState();
  const { currentUser, reactions, onReactionToggle } = useAppProps();

  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const leaveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  const userId = currentUser?.id ?? "anon";

  useEffect(() => {
    const container = document.querySelector(".excalidraw");
    if (!container) return;

    const onMove = (ev: Event) => {
      const { clientX, clientY } = ev as MouseEvent;
      const rect = (container as HTMLElement).getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      let found: string | null = null;
      for (const el of elements) {
        if (el.type !== "stickynote") continue;
        const se = el as any;
        const { x: l, y: t } = sceneCoordsToViewportCoords(
          { sceneX: se.x ?? 0, sceneY: se.y ?? 0 }, appState,
        );
        const { x: r, y: b } = sceneCoordsToViewportCoords(
          { sceneX: (se.x ?? 0) + (se.width ?? 200), sceneY: (se.y ?? 0) + (se.height ?? 150) },
          appState,
        );
        if (
          mx >= l - appState.offsetLeft && mx <= r - appState.offsetLeft &&
          my >= t - appState.offsetTop  && my <= b - appState.offsetTop
        ) { found = el.id; break; }
      }

      if (found) {
        if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
        if (hoveredIdRef.current !== found) {
          hoveredIdRef.current = found;
          setHoveredId(found);
        }
      } else if (!leaveTimer.current) {
        leaveTimer.current = setTimeout(() => {
          hoveredIdRef.current = null;
          setHoveredId(null);
          leaveTimer.current = null;
        }, 150);
      }
    };

    container.addEventListener("mousemove", onMove);
    return () => container.removeEventListener("mousemove", onMove);
  }, [elements, appState]);

  const stickies = elements.filter((el) => el.type === "stickynote");
  if (stickies.length === 0) return null;

  type EmojiStat = { count: number; mine: boolean };
  const reactionMap = new Map<string, Map<string, EmojiStat>>();
  for (const r of reactions ?? []) {
    if (!reactionMap.has(r.elementId)) reactionMap.set(r.elementId, new Map());
    const em = reactionMap.get(r.elementId)!;
    const prev = em.get(r.emoji) ?? { count: 0, mine: false };
    em.set(r.emoji, {
      count: prev.count + 1,
      mine: prev.mine || r.userIds.includes(userId),
    });
  }

  return (
    <>
      {stickies.map((el) => {
        const e = el as any;
        const { x: vpLeft, y: vpBottom } = sceneCoordsToViewportCoords(
          { sceneX: e.x ?? 0, sceneY: (e.y ?? 0) + (e.height ?? 150) }, appState,
        );
        const { x: vpRight } = sceneCoordsToViewportCoords(
          { sceneX: (e.x ?? 0) + (e.width ?? 200), sceneY: (e.y ?? 0) + (e.height ?? 150) }, appState,
        );

        const left  = vpLeft - appState.offsetLeft;
        const top   = vpBottom - appState.offsetTop + 8;
        const width = vpRight - vpLeft;
        if (width < 30) return null;

        const elStats      = reactionMap.get(el.id) ?? new Map<string, EmojiStat>();
        const activeEmojis = Array.from(elStats.entries());
        const hasReactions = activeEmojis.length > 0;
        const isHovered    = hoveredId === el.id;
        const isPickerOpen = openPicker === el.id;
        const isExpanded   = expanded.has(el.id);
        const showBar      = isHovered || isPickerOpen || hasReactions;

        if (!showBar) return null;

        const reactedKeys  = new Set(activeEmojis.map(([e]) => e));
        const pickerEmojis = [
          ...activeEmojis.map(([e]) => e),
          ...QUICK_EMOJIS.filter((e) => !reactedKeys.has(e)),
        ];
        const visiblePicker = isExpanded ? pickerEmojis : pickerEmojis.slice(0, COLLAPSED_SHOW);
        const hasMore       = pickerEmojis.length > COLLAPSED_SHOW;

        return (
          <div
            key={el.id}
            style={{ position: "absolute", left, top, zIndex: 10004, pointerEvents: "auto", userSelect: "none" }}
          >
            {!isPickerOpen && (
              <div style={{
                display: "inline-flex", alignItems: "center",
                height: PILL_H, borderRadius: RADIUS,
                background: "#fff", boxShadow: SHADOW,
                overflow: "hidden",
              }}>
                <button
                  type="button"
                  title="Add reaction"
                  onClick={(ev) => { ev.stopPropagation(); setOpenPicker(el.id); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 40, height: PILL_H, flexShrink: 0,
                    background: "transparent", border: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  <span
                    style={{ display: "flex", width: 22, height: 22 }}
                    dangerouslySetInnerHTML={{ __html: SMILE_PLUS_SVG }}
                  />
                </button>

                {hasReactions && <div style={DIVIDER} />}

                {activeEmojis.map(([emoji, stat], i) => (
                  <React.Fragment key={emoji}>
                    {i > 0 && <div style={{ width: 1, height: 18, background: "rgba(0,0,0,0.07)", flexShrink: 0, alignSelf: "center" }} />}
                    <button
                      type="button"
                      title={stat.mine ? `Remove ${emoji}` : emoji}
                      onClick={(ev) => { ev.stopPropagation(); onReactionToggle?.(el.id, emoji, userId); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        height: PILL_H, padding: "0 12px", flexShrink: 0,
                        background: stat.mine ? "rgba(99,102,241,0.08)" : "transparent",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{emoji}</span>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: stat.mine ? "#4f46e5" : "rgba(0,0,0,0.6)",
                        fontFamily: "system-ui, sans-serif",
                      }}>{stat.count}</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {isPickerOpen && (
              <div style={{
                display: "inline-flex", alignItems: "center",
                height: PILL_H, borderRadius: RADIUS,
                background: "#fff", boxShadow: SHADOW,
                overflow: "hidden",
              }}>
                <button
                  type="button"
                  title="Close"
                  onClick={(ev) => { ev.stopPropagation(); setOpenPicker(null); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 40, height: PILL_H, flexShrink: 0,
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 16, color: "rgba(0,0,0,0.4)", fontWeight: 700,
                  }}
                >
                  ✕
                </button>

                <div style={DIVIDER} />

                {visiblePicker.map((emoji) => {
                  const stat = elStats.get(emoji);
                  const mine = stat?.mine ?? false;
                  const count = stat?.count ?? 0;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      title={mine ? `Remove ${emoji}` : emoji}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onReactionToggle?.(el.id, emoji, userId);
                        setOpenPicker(null);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        height: PILL_H, padding: count > 0 ? "0 10px" : "0 8px", flexShrink: 0,
                        background: mine ? "rgba(99,102,241,0.08)" : "transparent",
                        border: "none", cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{emoji}</span>
                      {count > 0 && (
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: mine ? "#4f46e5" : "rgba(0,0,0,0.55)",
                          fontFamily: "system-ui, sans-serif",
                        }}>{count}</span>
                      )}
                    </button>
                  );
                })}

                {hasMore && (
                  <button
                    type="button"
                    title={isExpanded ? "Show less" : "Show more"}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        next.has(el.id) ? next.delete(el.id) : next.add(el.id);
                        return next;
                      });
                    }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: PILL_H, flexShrink: 0,
                      background: "transparent", border: "none", cursor: "pointer",
                      fontSize: 10, color: "rgba(0,0,0,0.4)",
                    }}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default StickyReactionBar;
