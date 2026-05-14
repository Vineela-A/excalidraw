import { type ExcalidrawFontFaceDescriptor } from "../Fonts";

// Inter — modern clean sans-serif, served via jsDelivr/fontsource CDN
const BASE = "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest";

export const InterFontFaces: ExcalidrawFontFaceDescriptor[] = [
  { uri: `${BASE}/latin-400-normal.woff2` },
  { uri: `${BASE}/latin-ext-400-normal.woff2` },
];
