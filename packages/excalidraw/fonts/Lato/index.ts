import { type ExcalidrawFontFaceDescriptor } from "../Fonts";

// Lato — clean geometric sans-serif, served via jsDelivr/fontsource CDN
const BASE = "https://cdn.jsdelivr.net/fontsource/fonts/lato@latest";

export const LatoFontFaces: ExcalidrawFontFaceDescriptor[] = [
  { uri: `${BASE}/latin-400-normal.woff2` },
  { uri: `${BASE}/latin-ext-400-normal.woff2` },
];
