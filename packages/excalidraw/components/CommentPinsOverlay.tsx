import React, { useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { EMOJI_LIST, SMILE_PLUS_SVG } from "../src/commentConstants";
import { useExcalidrawElements, useExcalidrawAppState, useApp } from "./App";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { getElementAbsoluteCoords } from "@excalidraw/element";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

/**
 * Lightweight comment pins overlay.
 * NOTE: Comments should be stored outside elements (see design).
 * This component renders placeholder pins for elements that have
 * `customData.commentPin === true` to demonstrate pin placement.
 * Integrators should pass real comment threads from external store
 * (or expose via window events) and render them similarly.
 */

const PinSize = 28;

const CommentPinsOverlay: React.FC = () => {
  const elements = useExcalidrawElements();
  const appState = useExcalidrawAppState();

  const elementsMap = useMemo(() => new Map(elements.map((e) => [e.id, e])), [elements]);

  // collect all pins from elements; support backward-compatible `pin` and new `commentPins[]`
  const pins = useMemo(() => {
    return elements.flatMap((el) => {
      const cd = (el.customData as any) || {};
      const arr = Array.isArray(cd.commentPins) ? cd.commentPins : cd.pin ? [cd.pin] : [];
      return arr.map((pin: any) => ({ el, pin }));
    });
  }, [elements]);
  const [openThreadFor, setOpenThreadFor] = useState<string | null>(null);

  const ThreadPopover: React.FC<{ el: NonDeletedExcalidrawElement; pin: any }> = ({ el, pin }) => {
    const app = useApp();
    const [replyValue, setReplyValue] = useState<string>("");
    const [emojiPickerFor, setEmojiPickerFor] = useState<number | null>(null);
    const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});

    const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!replyValue.trim()) return;
      try {
        const elementsMap = app.scene.getElementsMapIncludingDeleted();
        const target = elementsMap.get(el.id);
        if (target) {
          const existing = (target.customData as any) || {};
          const pinsArr = Array.isArray(existing.commentPins) ? existing.commentPins : existing.pin ? [existing.pin] : [];
          const comment = {
            id: `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            text: replyValue.trim(),
            user: "You",
            time: Date.now(),
          };
          const nextPins = pinsArr.map((p: any) => (p.id === pin.id ? { ...p, comments: [...(p.comments || []), comment] } : p));
          const next = { ...existing, commentPins: nextPins, commentPin: true };
          app.scene.mutateElement(target, { customData: next });
        }
      } catch (err) {
        // ignore
      }
    };

    const toggleReaction = (commentIndex: number, emoji = "🙂") => {
      try {
        const elementsMap = app.scene.getElementsMapIncludingDeleted();
        const target = elementsMap.get(el.id);
        if (!target) return;
        const existing = (target.customData as any) || {};
        const pinsArr = Array.isArray(existing.commentPins) ? existing.commentPins : existing.pin ? [existing.pin] : [];
        const nextPins = pinsArr.map((p: any) => {
          if (p.id !== pin.id) return p;
          const nextComments = (p.comments || []).map((c: any, idx: number) => {
            if (idx !== commentIndex) return c;
            const reactions = { ...(c.reactions || {}) };
            reactions[emoji] = (reactions[emoji] || 0) + 1;
            return { ...c, reactions };
          });
          return { ...p, comments: nextComments };
        });
        const next = { ...existing, commentPins: nextPins };
        app.scene.mutateElement(target, { customData: next });
      } catch (e) {
        // ignore
      }
    };

    // read latest pin data from scene on each render to reflect mutations
    const getLatestPin = () => {
      try {
        const elementsMap = app.scene.getElementsMapIncludingDeleted();
        const target = elementsMap.get(el.id);
        if (!target) return pin;
        const cd = (target.customData as any) || {};
        const pinsArr = Array.isArray(cd.commentPins) ? cd.commentPins : cd.pin ? [cd.pin] : [];
        return pinsArr.find((p: any) => p.id === pin.id) || pin;
      } catch (e) {
        return pin;
      }
    };

    const latestPin = getLatestPin();
    const comments = (latestPin && latestPin.comments) || [];

    return (
      <div style={{ width: 380, maxWidth: "calc(100vw - 24px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div />
          <div style={{ fontSize: 20, lineHeight: 1, cursor: "pointer", color: "#6b7280" }}>⋯</div>
        </div>
        <div style={{ maxHeight: 300, overflow: "auto", marginBottom: 8, paddingRight: 8 }}>
          {comments.length ? (
            comments.map((c: any, idx: number) => (
              <div key={c.id || idx} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: "#1FA9B6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 14, flex: "0 0 auto" }}>
                  {(c.user || c.author || "U").charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{c.author || c.user || "Anonymous User"}</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#111" }}>{c.text}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(c.time || Date.now()).toLocaleString()}</div>
                        <div style={{ position: "relative" }}>
                          <button
                            ref={(el) => { btnRefs.current[idx] = el; }}
                            type="button"
                            onClick={() => setEmojiPickerFor((s) => (s === idx ? null : idx))}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: (c.reactions && Object.values(c.reactions).reduce((s: number, v: any) => s + (typeof v === "number" ? v : 0), 0) > 0) ? "#fff" : "#F3F4F6",
                              border: (c.reactions && Object.values(c.reactions).reduce((s: number, v: any) => s + (typeof v === "number" ? v : 0), 0) > 0) ? "1px solid #c7def8" : "1px solid transparent",
                              cursor: "pointer",
                            }}
                            aria-label="Open emoji picker"
                          >
                            <span style={{ display: "inline-block", lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: SMILE_PLUS_SVG }} />
                          </button>
                          {c.reactions && Object.values(c.reactions).reduce((s: number, v: any) => s + (typeof v === "number" ? v : 0), 0) > 0 && (
                            <div style={{ color: "#374151", fontSize: 13, position: "absolute", right: -8, top: 6 }}>{Object.values(c.reactions).reduce((s: number, v: any) => s + (typeof v === "number" ? v : 0), 0)}</div>
                          )}

                          {/* emoji picker rendered into body via portal to avoid clipping */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#666", fontSize: 13 }}>No comments</div>
          )}
        </div>
        {emojiPickerFor !== null && btnRefs.current[emojiPickerFor] && createPortal(
          (() => {
            try {
              const btn = btnRefs.current[emojiPickerFor!];
              if (!btn) return null;
              const rect = btn.getBoundingClientRect();
              const pickerWidth = 260;
              const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
              let left = rect.left + rect.width / 2 - pickerWidth / 2;
              if (left < 8) left = 8;
              if (left + pickerWidth > vw - 8) left = vw - 8 - pickerWidth;
              const top = rect.bottom + 8;

              return (
                <div
                  style={{
                    position: "fixed",
                    left: `${left}px`,
                    top: `${top}px`,
                    width: pickerWidth,
                    maxHeight: 220,
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 10,
                    boxShadow: "0 8px 30px rgba(16,24,40,0.12)",
                    padding: 8,
                    overflow: "auto",
                    zIndex: 10010,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          toggleReaction(emojiPickerFor!, emoji);
                          setEmojiPickerFor(null);
                        }}
                        style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            } catch (e) {
              return null;
            }
          })(),
          document.body,
        )}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
          <input
            value={replyValue}
            onChange={(e) => setReplyValue(e.target.value)}
            placeholder="Leave a reply. Use @ to mention."
            style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#fff" }}
          />
          <button
            type="submit"
            aria-label="Send reply"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            ➤
          </button>
        </form>
      </div>
    );
  };

  if (!pins.length) return null;

  return (
    <>
      {pins.map(({ el, pin }: { el: NonDeletedExcalidrawElement; pin: any }) => {
        // If the individual pin has saved scene coords, use them so the bubble
        // appears exactly where the user placed it. Otherwise fallback to
        // bottom-right of element.
        let viewportX: number, viewportY: number;
        if (pin && typeof pin.sceneX === "number" && typeof pin.sceneY === "number") {
          const p = sceneCoordsToViewportCoords({ sceneX: pin.sceneX, sceneY: pin.sceneY }, appState);
          viewportX = p.x;
          viewportY = p.y;
        } else {
          const [absX, absY] = getElementAbsoluteCoords(el, elementsMap as any);
          const p = sceneCoordsToViewportCoords({ sceneX: absX + el.width, sceneY: absY + el.height }, appState);
          viewportX = p.x;
          viewportY = p.y;
        }

        const left = viewportX - appState.offsetLeft;
        const top = viewportY - appState.offsetTop;

        const comments = (pin && pin.comments) || [];
        const firstComment = comments.length ? comments[0].text : null;
        const key = `${el.id}:${pin.id}`;

        return (
          <div
            key={key}
            style={{
              position: "absolute",
              left: `${left}px`,
              top: `${top}px`,
              transform: `translate(-50%, -50%)`,
              zIndex: 10000,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                width: PinSize,
                height: PinSize,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
              title="Open comment thread"
              onClick={() => {
                // toggle local thread popover for this specific pin
                setOpenThreadFor((s) => (s === key ? null : key));
                const ev = new CustomEvent("excalidraw:openCommentThread", {
                  detail: { elementId: el.id, pinId: pin.id },
                });
                window.dispatchEvent(ev);
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1FA9B6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                {((comments && comments[0] && comments[0].user) || (pin && pin.author) || "U").toString().charAt(0).toUpperCase()}
              </div>
            </div>
                {openThreadFor === key && (() => {
                  const popoverWidth = 360;
                  const vpX = viewportX - appState.offsetLeft;
                  const screenW = typeof window !== "undefined" ? Math.max(document.documentElement.clientWidth, window.innerWidth || 0) : 1024;
                  const placeRight = vpX < screenW / 2; // prefer placing to the right if pin is on left half
                  const leftPos = placeRight ? `16px` : `-${popoverWidth + 16}px`;

                  return (
                    <div
                      style={{
                        position: "absolute",
                        left: leftPos,
                        top: `-50%`,
                        width: popoverWidth,
                        minWidth: 260,
                        maxWidth: 420,
                        background: "white",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: "0 12px 40px rgba(16,24,40,0.12)",
                        pointerEvents: "auto",
                        zIndex: 10001,
                        transformOrigin: placeRight ? "left center" : "right center",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* tail shadow */}
                      {placeRight ? (
                        <div style={{ position: "absolute", left: -11, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: "11px solid rgba(0,0,0,0.08)", zIndex: 10000 }} />
                      ) : (
                        <div style={{ position: "absolute", right: -11, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "11px solid rgba(0,0,0,0.08)", zIndex: 10000 }} />
                      )}
                      {/* tail (white) */}
                      {placeRight ? (
                        <div style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderRight: "10px solid #fff", zIndex: 10001 }} />
                      ) : (
                        <div style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: "10px solid #fff", zIndex: 10001 }} />
                      )}

                      <div style={{ marginBottom: 8 }}>
                        {firstComment ? (
                          <div style={{ color: "#111", fontSize: 13 }}>{firstComment}</div>
                        ) : (
                          <div style={{ color: "#666", fontSize: 13 }}>No comments</div>
                        )}
                      </div>
                      <div>
                        <ThreadPopover el={el} pin={pin} />
                      </div>
                    </div>
                  );
                })()}
          </div>
        );
      })}
    </>
  );
};

export default CommentPinsOverlay;
