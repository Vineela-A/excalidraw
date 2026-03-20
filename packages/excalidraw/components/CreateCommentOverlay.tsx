import React, { useEffect, useRef, useState } from "react";
import { useApp, useAppProps } from "./App";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { COMMENT_FONT_FAMILY, COMMENT_FONT_SIZE_MD, COMMENT_ACCENT_COLOR } from "../src/commentConstants";

import "./CreateCommentOverlay.scss";

const EmojiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#F6F7F9"/>
    <path d="M8.5 10.5C9.32843 10.5 10 9.82843 10 9C10 8.17157 9.32843 7.5 8.5 7.5C7.67157 7.5 7 8.17157 7 9C7 9.82843 7.67157 10.5 8.5 10.5Z" fill="#6B7280"/>
    <path d="M15.5 10.5C16.3284 10.5 17 9.82843 17 9C17 8.17157 16.3284 7.5 15.5 7.5C14.6716 7.5 14 8.17157 14 9C14 9.82843 14.6716 10.5 15.5 10.5Z" fill="#6B7280"/>
    <path d="M8.5 15C9.88071 16.5 14.1193 16.5 15.5 15" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CreateCommentOverlay: React.FC = () => {
  const app = useApp();
  const { onCommentCreate, currentUser } = useAppProps();
  const [placing, setPlacing] = useState(false);
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    sceneX: number;
    sceneY: number;
    elementId: string;
  } | null>(null);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Listen for the "start placing a comment pin" signal
  useEffect(() => {
    const onStart = () => setPlacing(true);
    window.addEventListener("excalidraw:startCreateCommentPin", onStart as EventListener);
    return () => window.removeEventListener("excalidraw:startCreateCommentPin", onStart as EventListener);
  }, []);

  // On pointer down while placing, anchor to the clicked element
  useEffect(() => {
    if (!placing) return;

    const unsub = app.onPointerDownEmitter.on((_, pointerDownState) => {
      const hitElement = pointerDownState.hit?.element;
      if (!hitElement) {
        setPlacing(false);
        return;
      }
      const { x: sceneX, y: sceneY } = pointerDownState.origin;
      const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
        { sceneX, sceneY },
        app.state,
      );
      setPos({
        left: viewportX - app.state.offsetLeft,
        top: viewportY - app.state.offsetTop,
        sceneX,
        sceneY,
        elementId: hitElement.id,
      });
      setPlacing(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    });

    return () => unsub();
  }, [placing, app]);

  const cancel = () => {
    setPos(null);
    setText("");
  };

  const submit = () => {
    if (!pos || !text.trim()) {
      cancel();
      return;
    }
    const author = currentUser ?? { id: "anon", name: "You", avatarColor: COMMENT_ACCENT_COLOR };
    onCommentCreate?.({
      elementId: pos.elementId,
      sceneX: pos.sceneX,
      sceneY: pos.sceneY,
      text: text.trim(),
      author,
    });
    cancel();
  };

  if (!pos) return null;

  return (
    <div
      className="create-comment-overlay"
      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
      role="dialog"
      aria-label="Add comment"
    >
      <div className="create-comment-input">
        <input
          ref={inputRef}
          className="create-comment-field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment. Use @ to mention."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              cancel();
            }
          }}
        />
        <button
          type="button"
          className="create-comment-emoji"
          aria-label="Add emoji"
          onClick={() => {
            setText((s) => s + " 🙂");
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <EmojiIcon />
        </button>
        <button
          type="button"
          className="create-comment-send"
          aria-label="Send comment"
          onClick={submit}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CreateCommentOverlay;
