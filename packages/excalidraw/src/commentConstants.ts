export const EMOJI_LIST: string[] = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","🙂",
  "🙃","😉","😍","😘","😚","😋","😜","😝","😛","🫠",
  "🤗","🤩","🤔","🤨","😐","😑","😶","😏","😒","🙄",
  "😬","😴","😪","😓","😥","😰","😢","😭","😠","😡",
  "🤬","🤯","😳","🥰","🤤","🤮","🤢","🤧","😷","🤒",
  "👍","👎","👏","🙏","💪","✌️","🤝","❤️","💔","🎉",
  "🔥","💯","⭐","🌟","✨","🎈","🎁","🏆","🥇","🥳",
];


// Common font family used for comment UIs (pins, overlays, dev helpers)
export const COMMENT_FONT_FAMILY = "Patrick Hand, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Standardized font sizes for comment UI
export const COMMENT_FONT_SIZE_XS = "11px"; // timestamps, small metadata
export const COMMENT_FONT_SIZE_SM = "12px"; // tooltips, small labels
export const COMMENT_FONT_SIZE_MD = "13px"; // body small text
export const COMMENT_FONT_SIZE = "14px"; // default comment text / buttons
export const COMMENT_FONT_SIZE_LG = "18px"; // emoji grid and larger buttons
export const COMMENT_FONT_SIZE_XL = "20px"; // menus / headings

// Accent color used for avatars, pins and highlights
export const COMMENT_ACCENT_COLOR = "#1FA9B6";

// Avatar sizes (pixels)
export const COMMENT_AVATAR_SIZE = 36;
export const COMMENT_AVATAR_RADIUS = 18;
export const COMMENT_REPLY_AVATAR_SIZE = 28;
export const COMMENT_REPLY_AVATAR_RADIUS = 14;

export const SMILE_PLUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="22" height="22">
  <circle cx="10" cy="11" r="9" fill="#f0f0f0"/>
  <circle cx="7.5" cy="9.5" r="1.2" fill="#555"/>
  <circle cx="12.5" cy="9.5" r="1.2" fill="#555"/>
  <path d="M7 13.5 Q10 16 13 13.5" fill="none" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="17" cy="6" r="4" fill="#6366f1"/>
  <line x1="17" y1="3.8" x2="17" y2="8.2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="14.8" y1="6" x2="19.2" y2="6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

export const SPEECH_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' preserveAspectRatio='xMidYMid meet'>
  <defs>
    <filter id='ds' x='-50%' y='-50%' width='200%' height='200%'>
      <feDropShadow dx='0' dy='2' stdDeviation='3' flood-color='#000' flood-opacity='0.18'/>
    </filter>
  </defs>
  <g filter='url(#ds)'>
    <circle cx='32' cy='32' r='20' fill='#ffffff'/>
    <path d='M50 38 L64 44 L50 32 Z' fill='#ffffff' />
    <circle cx='32' cy='32' r='15' fill='${COMMENT_ACCENT_COLOR}'/>
  </g>
</svg>
`;

export const SPEECH_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(SPEECH_SVG)}`;

export default { SPEECH_SVG, SPEECH_DATA_URL, EMOJI_LIST };