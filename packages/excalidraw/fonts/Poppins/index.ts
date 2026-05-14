import { type ExcalidrawFontFaceDescriptor } from "../Fonts";

// Poppins — modern geometric round sans-serif, served via jsDelivr/fontsource CDN
const BASE = "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest";

export const PoppinsFontFaces: ExcalidrawFontFaceDescriptor[] = [
  { uri: `${BASE}/latin-400-normal.woff2` },
  { uri: `${BASE}/latin-ext-400-normal.woff2` },
];
