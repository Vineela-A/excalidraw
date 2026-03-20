import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useExcalidrawAppState, useAppProps } from "./App";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import {
  SMILE_PLUS_SVG,
  COMMENT_FONT_FAMILY,
  COMMENT_FONT_SIZE,
  COMMENT_FONT_SIZE_SM,
  COMMENT_FONT_SIZE_MD,
  COMMENT_ACCENT_COLOR,
  COMMENT_AVATAR_SIZE,
  COMMENT_AVATAR_RADIUS,
  COMMENT_REPLY_AVATAR_SIZE,
  COMMENT_REPLY_AVATAR_RADIUS,
} from "../src/commentConstants";
import EmojiPicker from "./EmojiPicker";
import type { CommentPin, CommentReply } from "../types";

const PIN_SIZE = 36;
const LONG_PRESS_MS = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString([], {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function avatarStyle(
  size: number,
  radius: number,
  color = COMMENT_ACCENT_COLOR,
): React.CSSProperties {
  return {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: radius,
    background: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
    fontSize: COMMENT_FONT_SIZE_SM,
    flexShrink: 0,
    userSelect: "none",
  };
}

// ─── Emoji reaction button ─────────────────────────────────────────────────────

interface EmojiReactionBtnProps {
  btnRef?: React.Ref<HTMLButtonElement>;
  onClick: () => void;
}
const EmojiReactionBtn: React.FC<EmojiReactionBtnProps> = ({ btnRef, onClick }) => (
  <button
    ref={btnRef}
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      width: 28,
      height: 28,
      borderRadius: 14,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
      border: "1px solid transparent",
      cursor: "pointer",
      flexShrink: 0,
      padding: 0,
    }}
    aria-label="React"
  >
    <span
      dangerouslySetInnerHTML={{ __html: SMILE_PLUS_SVG }}
      style={{ display: "inline-flex", width: 18, height: 18 }}
    />
  </button>
);

// ─── Long-press context menu ───────────────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  isReply: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, isReply, onEdit, onDelete, onClose }) => {
  // Close on outside click — use "mouseup" so button onClick fires before close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-comment-ctx-menu]")) {
        onClose();
      }
    };
    document.addEventListener("mouseup", handler);
    return () => document.removeEventListener("mouseup", handler);
  }, [onClose]);

  return createPortal(
    <div
      data-comment-ctx-menu="1"
      data-comment-thread="1"
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 99999,
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        padding: 4,
        minWidth: 130,
        fontFamily: COMMENT_FONT_FAMILY,
      }}
    >
      <button
        type="button"
        onClick={() => { onEdit(); onClose(); }}
        style={menuItemStyle("#111827")}
      >
        ✏️  Edit
      </button>
      {isReply && (
        <button
          type="button"
          onClick={() => { onDelete(); onClose(); }}
          style={menuItemStyle("#dc2626")}
        >
          🗑️  Delete
        </button>
      )}
    </div>,
    document.body,
  );
};

function menuItemStyle(color: string): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: "9px 14px",
    textAlign: "left",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color,
    fontFamily: COMMENT_FONT_FAMILY,
    fontSize: COMMENT_FONT_SIZE_MD,
    borderRadius: 6,
  };
}

// ─── Single comment row ───────────────────────────────────────────────────────

interface CommentRowProps {
  comment: CommentReply;
  isFirst: boolean;
  onReaction: (emoji: string) => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
}

const CommentRow: React.FC<CommentRowProps> = ({ comment: c, isFirst, onReaction, onEdit, onDelete }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(c.text);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // keep editText in sync when comment is updated externally
  useEffect(() => {
    if (!isEditing) setEditText(c.text);
  }, [c.text, isEditing]);

  // auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const startPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    pressTimer.current = setTimeout(() => {
      setCtxMenu({ x: clientX, y: clientY });
    }, LONG_PRESS_MS);
  }, []);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleSave = () => {
    if (editText.trim() && editText.trim() !== c.text) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(c.text);
    setIsEditing(false);
  };

  const avatarSize   = isFirst ? COMMENT_AVATAR_SIZE   : COMMENT_REPLY_AVATAR_SIZE;
  const avatarRadius = isFirst ? COMMENT_AVATAR_RADIUS  : COMMENT_REPLY_AVATAR_RADIUS;
  const avatarColor  = c.author.avatarColor ?? COMMENT_ACCENT_COLOR;
  const reactions    = c.reactions ?? {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: isFirst ? 18 : 14,
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      <div style={avatarStyle(avatarSize, avatarRadius, avatarColor)}>
        {(c.author.name || "?").charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Name + timestamp (left) | emoji btn (right) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: COMMENT_FONT_SIZE, color: "#111827", whiteSpace: "nowrap" }}>
              {c.author.name}
            </span>
            <span style={{ fontSize: COMMENT_FONT_SIZE_SM, color: "#9ca3af", whiteSpace: "nowrap" }}>
              {formatTimestamp(c.time)}
            </span>
          </div>
          <EmojiReactionBtn btnRef={btnRef} onClick={() => setPickerOpen((v) => !v)} />
        </div>

        {/* Comment text OR edit textarea */}
        {isEditing ? (
          <div style={{ marginTop: 6 }}>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
                if (e.key === "Escape") handleCancelEdit();
              }}
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 10px",
                borderRadius: 8,
                border: `1.5px solid ${COMMENT_ACCENT_COLOR}`,
                fontFamily: COMMENT_FONT_FAMILY,
                fontSize: COMMENT_FONT_SIZE_MD,
                color: "#111827",
                resize: "vertical",
                outline: "none",
                background: "#FAFAFA",
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: COMMENT_ACCENT_COLOR,
                  color: "#fff",
                  fontFamily: COMMENT_FONT_FAMILY,
                  fontSize: COMMENT_FONT_SIZE_SM,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  color: "#6b7280",
                  fontFamily: COMMENT_FONT_FAMILY,
                  fontSize: COMMENT_FONT_SIZE_SM,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            title="Hold to edit / delete"
            style={{
              marginTop: 4,
              fontSize: COMMENT_FONT_SIZE_MD,
              color: "#111827",
              lineHeight: 1.5,
              wordBreak: "break-word",
              cursor: "text",
              userSelect: "none",
            }}
          >
            {c.text}
          </div>
        )}

        {/* Reaction pills */}
        {hasReactions && !isEditing && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {Object.entries(reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReaction(emoji)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: "#F0F9FF",
                  border: "1.5px solid #BAE6FD",
                  cursor: "pointer",
                  fontFamily: COMMENT_FONT_FAMILY,
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: 16 }}>{emoji}</span>
                <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Emoji picker portal */}
      {pickerOpen && btnRef.current &&
        createPortal(
          <div data-comment-thread="1">
            <EmojiPicker
              anchorEl={btnRef.current}
              onSelect={(emoji) => { onReaction(emoji); setPickerOpen(false); }}
              onClose={() => setPickerOpen(false)}
            />
          </div>,
          document.body,
        )
      }

      {/* Long-press context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          isReply={!isFirst}
          onEdit={() => setIsEditing(true)}
          onDelete={onDelete}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
};

// ─── Thread Popover ───────────────────────────────────────────────────────────

interface ThreadPopoverProps {
  pin: CommentPin;
  onClose: () => void;
}

const ThreadPopover: React.FC<ThreadPopoverProps> = ({ pin, onClose }) => {
  const {
    onCommentDelete,
    onCommentReply,
    onCommentReaction,
    onCommentEdit,
    onCommentReplyDelete,
    currentUser,
  } = useAppProps();
  const [replyText, setReplyText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const author = currentUser ?? { id: "anon", name: "You", avatarColor: COMMENT_ACCENT_COLOR };

  const handleReply = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!replyText.trim()) return;
    onCommentReply?.(pin.id, replyText.trim(), author);
    setReplyText("");
  };

  const handleDeleteThread = () => {
    onCommentDelete?.(pin.id);
    setMenuOpen(false);
    onClose();
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(16,24,40,0.14)",
        border: "1px solid #E5E7EB",
        padding: "16px 18px",
        width: 460,
        maxWidth: "calc(100vw - 24px)",
        fontFamily: COMMENT_FONT_FAMILY,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ⋯ menu (delete entire thread) */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            style={{
              fontSize: 20,
              lineHeight: 1,
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px 8px",
              borderRadius: 6,
              border: "none",
              background: "transparent",
              letterSpacing: 2,
            }}
          >
            •••
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 32,
                zIndex: 10010,
                minWidth: 140,
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                padding: 6,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleDeleteThread}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 12px",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#dc2626",
                  fontFamily: COMMENT_FONT_FAMILY,
                  fontSize: COMMENT_FONT_SIZE,
                }}
              >
                Delete thread
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comment list */}
      <div style={{ maxHeight: 360, overflowY: "auto", marginBottom: 16 }}>
        {pin.comments.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: COMMENT_FONT_SIZE_MD }}>No comments yet.</div>
        ) : (
          pin.comments.map((c: CommentReply, idx: number) => (
            <CommentRow
              key={c.id}
              comment={c}
              isFirst={idx === 0}
              onReaction={(emoji) => onCommentReaction?.(c.id, emoji, author.id)}
              onEdit={(text) => onCommentEdit?.(c.id, text)}
              onDelete={() => onCommentReplyDelete?.(c.id)}
            />
          ))
        )}
      </div>

      {/* Reply input */}
      <form
        onSubmit={handleReply}
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          borderTop: "1px solid #F3F4F6",
          paddingTop: 14,
        }}
      >
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Leave a reply. Use @ to mention."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #E5E7EB",
            background: "#FAFAFA",
            fontFamily: COMMENT_FONT_FAMILY,
            fontSize: COMMENT_FONT_SIZE_MD,
            outline: "none",
            color: "#111827",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
          }}
        />
        <button
          type="submit"
          aria-label="Send reply"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: COMMENT_ACCENT_COLOR,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

// ─── Main Overlay ─────────────────────────────────────────────────────────────

const CommentPinsOverlay: React.FC = () => {
  const appState = useExcalidrawAppState();
  const { commentPins } = useAppProps();
  const [openThreadFor, setOpenThreadFor] = useState<string | null>(null);

  // Close the open thread when the user clicks anywhere outside a comment element
  useEffect(() => {
    if (!openThreadFor) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-comment-thread]")) {
        setOpenThreadFor(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openThreadFor]);

  if (!commentPins || commentPins.length === 0) return null;

  return (
    <>
      {commentPins.map((pin: CommentPin) => {
        const { x: vpX, y: vpY } = sceneCoordsToViewportCoords(
          { sceneX: pin.sceneX, sceneY: pin.sceneY },
          appState,
        );
        const left = vpX - appState.offsetLeft;
        const top  = vpY - appState.offsetTop;
        const isOpen = openThreadFor === pin.id;
        const firstAuthor = pin.comments[0]?.author;

        const screenW     = typeof window !== "undefined" ? window.innerWidth : 1024;
        const placeRight  = left < screenW / 2;
        const popoverLeft = placeRight ? `${PIN_SIZE + 8}px` : `${-(460 + 8)}px`;

        return (
          <div
            key={pin.id}
            data-comment-thread="1"
            style={{
              position: "absolute",
              left: `${left}px`,
              top: `${top}px`,
              transform: "translate(-50%, -50%)",
              zIndex: 10000,
              pointerEvents: "auto",
            }}
          >
            {/* Pin badge */}
            <div
              title="View comment thread"
              onClick={() => setOpenThreadFor(isOpen ? null : pin.id)}
              style={{
                width: PIN_SIZE,
                height: PIN_SIZE,
                borderRadius: "50%",
                background: isOpen ? COMMENT_ACCENT_COLOR : "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
                border: `2px solid ${isOpen ? COMMENT_ACCENT_COLOR : "#E5E7EB"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <div
                style={avatarStyle(
                  COMMENT_REPLY_AVATAR_SIZE,
                  COMMENT_REPLY_AVATAR_RADIUS,
                  isOpen ? "rgba(255,255,255,0.25)" : (firstAuthor?.avatarColor ?? COMMENT_ACCENT_COLOR),
                )}
              >
                {(firstAuthor?.name ?? "?").charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Thread popover */}
            {isOpen && (
              <div
                style={{
                  position: "absolute",
                  left: popoverLeft,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10001,
                }}
              >
                <ThreadPopover pin={pin} onClose={() => setOpenThreadFor(null)} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default CommentPinsOverlay;
