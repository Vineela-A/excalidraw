import { type ExcalidrawFontFaceDescriptor } from "../Fonts";

// Open Sans — versatile humanist sans-serif, served via jsDelivr/fontsource CDN
const BASE = "https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest";

export const OpenSansFontFaces: ExcalidrawFontFaceDescriptor[] = [
  { uri: `${BASE}/latin-400-normal.woff2` },
  { uri: `${BASE}/latin-ext-400-normal.woff2` },
];
