import {
  CURSOR_LABEL_COLORS,
  CURSOR_LABEL_TEXT_COLOR,
  pickCursorLabelColor,
} from "../cursorLabel";

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("cursor label colours", () => {
  it("are unique hex values", () => {
    const fills = CURSOR_LABEL_COLORS.map((c) => c.fill);
    expect(new Set(fills).size).toBe(fills.length);
    CURSOR_LABEL_COLORS.forEach(({ fill, accent }) => {
      expect(fill).toMatch(/^#[0-9a-f]{6}$/);
      expect(accent).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("give the label text at least AA contrast", () => {
    CURSOR_LABEL_COLORS.forEach(({ fill }) =>
      expect(contrast(fill, CURSOR_LABEL_TEXT_COLOR)).toBeGreaterThanOrEqual(4.5),
    );
  });

  it("keep the arrow and edge visible against a white canvas", () => {
    CURSOR_LABEL_COLORS.forEach(({ accent }) =>
      expect(contrast(accent, "#ffffff")).toBeGreaterThanOrEqual(3),
    );
  });

  it("picks the same colour for the same hash", () => {
    expect(pickCursorLabelColor(12345)).toEqual(pickCursorLabelColor(12345));
  });

  it("handles negative hashes", () => {
    expect(CURSOR_LABEL_COLORS).toContainEqual(pickCursorLabelColor(-987654321));
  });

  it("uses every palette entry across consecutive hashes", () => {
    const used = new Set(
      CURSOR_LABEL_COLORS.map((_, i) => pickCursorLabelColor(i)),
    );
    expect(used.size).toBe(CURSOR_LABEL_COLORS.length);
  });
});
