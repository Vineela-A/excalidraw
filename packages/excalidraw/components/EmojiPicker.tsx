import React, { useEffect, useRef } from "react";
import { EMOJI_LIST, COMMENT_FONT_SIZE_LG } from "../src/commentConstants";

interface EmojiPickerProps {
  anchorEl: HTMLElement;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const PICKER_WIDTH = 260;

const EmojiPicker: React.FC<EmojiPickerProps> = ({ anchorEl, onSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  const rect = anchorEl.getBoundingClientRect();
  const vw = window.innerWidth;
  let left = rect.left + rect.width / 2 - PICKER_WIDTH / 2;
  if (left < 8) left = 8;
  if (left + PICKER_WIDTH > vw - 8) left = vw - 8 - PICKER_WIDTH;
  const top = rect.bottom + 6;

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      style={{
        position: "fixed",
        left,
        top,
        width: PICKER_WIDTH,
        maxHeight: 220,
        overflowY: "auto",
        zIndex: 10010,
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        boxShadow: "0 8px 30px rgba(16,24,40,0.12)",
        padding: 8,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: COMMENT_FONT_SIZE_LG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
