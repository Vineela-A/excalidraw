import { type ExcalidrawFontFaceDescriptor } from "../Fonts";

// Roboto — Google's Material Design sans-serif, served via jsDelivr/fontsource CDN
const BASE = "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest";

export const RobotoFontFaces: ExcalidrawFontFaceDescriptor[] = [
  { uri: `${BASE}/latin-400-normal.woff2` },
  { uri: `${BASE}/latin-ext-400-normal.woff2` },
];
