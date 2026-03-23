import React, { useEffect, useRef, useState } from "react";
import EmojiPickerLib from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

// ---------------------------------------------------------------------------
// Sticker categories — curated emoji for large canvas stickers
// ---------------------------------------------------------------------------
const STICKER_CATEGORIES: { label: string; items: string[] }[] = [
  {
    label: "Celebration",
    items: ["🎉","🎊","🥳","🎈","🏆","🥇","🎁","🎀","🎆","🎇","✨","🌟","⭐","💫","🎶","🎵"],
  },
  {
    label: "Reactions",
    items: ["👍","👎","❤️","💔","🔥","💯","😂","😮","😢","😡","🤯","🥰","😎","🤔","🙄","😴"],
  },
  {
    label: "Hand Gestures",
    items: ["👏","🙌","🤝","🤜","🤛","✊","👊","🤞","✌️","🤟","🤙","👋","🙏","💪","👀","💬"],
  },
  {
    label: "Animals",
    items: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐙","🦋"],
  },
  {
    label: "Nature",
    items: ["🌸","🌺","🌻","🌹","🌷","🍀","🌿","🌱","🌲","🌳","🍁","🍂","🌊","⛰️","🌈","☀️"],
  },
  {
    label: "Food",
    items: ["🍕","🍔","🌮","🍜","🍣","🍰","🎂","🍩","🍪","🍫","🍓","🍕","☕","🧃","🍺","🥤"],
  },
  {
    label: "Objects",
    items: ["💡","🔑","🔒","📌","📎","✂️","🔧","🎯","💎","🎮","📱","💻","📷","🎸","🎨","🚀"],
  },
  {
    label: "Symbols",
    items: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","♥️","💕","💞","💓","💗","💖","💘","💝"],
  },
];

interface FullEmojiPickerProps {
  anchorEl: HTMLElement;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

type Tab = "emojis" | "stickers";

const PICKER_WIDTH = 350;

const FullEmojiPicker: React.FC<FullEmojiPickerProps> = ({
  anchorEl,
  onSelect,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("emojis");

  // Position: open above or below the anchor
  const rect = anchorEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = rect.left + rect.width / 2 - PICKER_WIDTH / 2;
  if (left < 8) left = 8;
  if (left + PICKER_WIDTH > vw - 8) left = vw - 8 - PICKER_WIDTH;

  // Prefer opening above if not enough space below
  const spaceBelow = vh - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  const openAbove = spaceBelow < 430 && spaceAbove > spaceBelow;
  const top = openAbove ? undefined : rect.bottom + 6;
  const bottom = openAbove ? vh - rect.top + 6 : undefined;

  // Close on outside pointer-down
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [onClose]);

  const handleEmojiClick = (data: EmojiClickData) => {
    onSelect(data.emoji);
    onClose();
  };

  const handleStickerClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        left,
        top,
        bottom,
        width: PICKER_WIDTH,
        zIndex: 10020,
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(16,24,40,0.18)",
        border: "1px solid #E5E7EB",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Tab strip */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #F3F4F6",
          background: "#FAFAFA",
          padding: "8px 8px 0",
          gap: 4,
        }}
      >
        {(["emojis", "stickers"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "6px 0",
              border: "none",
              borderRadius: "8px 8px 0 0",
              background: tab === t ? "#fff" : "transparent",
              fontFamily: "system-ui, sans-serif",
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#111827" : "#6B7280",
              cursor: "pointer",
              borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {t === "emojis" ? "😀 Emojis" : "🎨 Stickers"}
          </button>
        ))}
      </div>

      {/* Emojis tab — full emoji-picker-react */}
      {tab === "emojis" && (
        <EmojiPickerLib
          onEmojiClick={handleEmojiClick}
          width={PICKER_WIDTH}
          height={420}
          lazyLoadEmojis
          previewConfig={{ showPreview: false }}
          skinTonesDisabled={false}
          searchPlaceholder="Search emojis…"
          style={{ borderRadius: 0, border: "none", boxShadow: "none" }}
        />
      )}

      {/* Stickers tab — curated emoji grid */}
      {tab === "stickers" && (
        <div
          style={{
            height: 420,
            overflowY: "auto",
            padding: "10px 10px 14px",
          }}
        >
          {STICKER_CATEGORIES.map((cat) => (
            <div key={cat.label} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9CA3AF",
                  fontFamily: "system-ui, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                  paddingLeft: 2,
                }}
              >
                {cat.label}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8, 1fr)",
                  gap: 4,
                }}
              >
                {cat.items.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    title={emoji}
                    onClick={() => handleStickerClick(emoji)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FullEmojiPicker;
