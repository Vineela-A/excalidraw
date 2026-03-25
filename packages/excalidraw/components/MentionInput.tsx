/**
 * Reusable @mention utilities.
 *
 * Usage:
 *   const mention = useMention(text, setText, getSuggestions);
 *
 *   <div style={{ position: "relative" }}>
 *     <MentionDropdown mention={mention} />
 *     <input value={text} onChange={e => setText(e.target.value)} ... />
 *   </div>
 *
 * The host component must wrap the input in a `position: relative` container
 * so the dropdown floats above it correctly.
 */

import React from "react";
import {
  COMMENT_FONT_FAMILY,
  COMMENT_FONT_SIZE_MD,
  COMMENT_FONT_SIZE_SM,
  COMMENT_ACCENT_COLOR,
  COMMENT_AVATAR_RADIUS,
} from "../src/commentConstants";

export interface MentionSuggestion {
  id: string;
  name: string;
}

export interface MentionState {
  suggestions: MentionSuggestion[];
  insertMention: (name: string) => void;
}

/**
 * Detects an `@word` pattern at the end of `text` and returns matching
 * suggestions from `getSuggestions`. Call `state.insertMention(name)` to
 * replace the `@fragment` with `@name `.
 */
export function useMention(
  text: string,
  setText: (t: string) => void,
  getSuggestions?: (query: string) => MentionSuggestion[],
): MentionState {
  const atMatch = text.match(/@(\w*)$/);
  const mentionQuery = atMatch ? atMatch[1] : null;

  const suggestions =
    mentionQuery !== null && getSuggestions ? getSuggestions(mentionQuery) : [];

  const insertMention = (name: string) => {
    setText(text.replace(/@\w*$/, `@${name} `));
  };

  return { suggestions, insertMention };
}

/**
 * Floating dropdown that appears above the input when there are suggestions.
 * Uses `onMouseDown` + `e.preventDefault()` so the input never loses focus.
 */
export const MentionDropdown: React.FC<{ mention: MentionState }> = ({
  mention,
}) => {
  if (mention.suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 4px)",
        left: 0,
        right: 0,
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        zIndex: 10020,
        overflow: "hidden",
      }}
    >
      {mention.suggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            mention.insertMention(s.name);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: COMMENT_FONT_FAMILY,
            fontSize: COMMENT_FONT_SIZE_MD,
            color: "#111827",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              minWidth: 24,
              borderRadius: COMMENT_AVATAR_RADIUS,
              background: COMMENT_ACCENT_COLOR,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#fff",
              fontSize: COMMENT_FONT_SIZE_SM,
              flexShrink: 0,
              userSelect: "none",
            }}
          >
            {s.name[0].toUpperCase()}
          </span>
          <span>@{s.name}</span>
        </button>
      ))}
    </div>
  );
};
