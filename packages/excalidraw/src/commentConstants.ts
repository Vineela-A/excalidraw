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

export const SMILE_PLUS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24"
     width="24"
     height="24"
     fill="none"
     stroke="#8A8F98"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">

  <!-- Circle with gap at top-right -->
  <path d="M4 12a8 8 0 0 1 14-5"/>
  <path d="M20 12a8 8 0 0 1-8 8a8 8 0 0 1-8-8"/>

  <!-- Eyes -->
  <circle cx="9" cy="10" r="1" fill="#8A8F98" stroke="none"/>
  <circle cx="13" cy="10" r="1" fill="#8A8F98" stroke="none"/>

  <!-- Smile -->
  <path d="M9 14c1.4 1.2 3.6 1.2 5 0"/>

  <!-- Plus -->
  <line x1="18" y1="4" x2="18" y2="8"/>
  <line x1="16" y1="6" x2="20" y2="6"/>

</svg>
`;

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