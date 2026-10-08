import {
  STICKY_BASE_FONT_SIZE,
  STICKY_BASE_SIZE,
  STICKY_MAX_FONT_SIZE,
  STICKY_MAX_SIZE,
  STICKY_MIN_FONT_SIZE,
  STICKY_MIN_SIZE,
  getStickyCreationSize,
} from "../stickySize";

describe("getStickyCreationSize", () => {
  it("returns the base size at 100% zoom", () => {
    expect(getStickyCreationSize(1)).toEqual({
      size: STICKY_BASE_SIZE,
      fontSize: STICKY_BASE_FONT_SIZE,
    });
  });

  it("makes notes larger in scene units when zoomed out", () => {
    expect(getStickyCreationSize(0.5).size).toBe(200);
    expect(getStickyCreationSize(0.25).size).toBe(400);
    expect(getStickyCreationSize(0.25).fontSize).toBe(56);
  });

  it("keeps the on-screen size about constant while unclamped", () => {
    [0.25, 0.5, 1, 1.5].forEach((zoom) => {
      expect(
        Math.abs(getStickyCreationSize(zoom).size * zoom - STICKY_BASE_SIZE),
      ).toBeLessThanOrEqual(1);
    });
  });

  it("makes notes smaller in scene units when zoomed in, down to a floor", () => {
    expect(getStickyCreationSize(1.5).size).toBe(67);
    expect(getStickyCreationSize(4).size).toBe(STICKY_MIN_SIZE);
  });

  it("caps the size and font when far zoomed out", () => {
    const result = getStickyCreationSize(0.05);
    expect(result.size).toBe(STICKY_MAX_SIZE);
    expect(result.fontSize).toBeLessThanOrEqual(STICKY_MAX_FONT_SIZE);
  });

  it("never drops the font below the minimum", () => {
    expect(getStickyCreationSize(10).fontSize).toBe(STICKY_MIN_FONT_SIZE);
  });

  it("falls back to the base size for an invalid zoom", () => {
    expect(getStickyCreationSize(0).size).toBe(STICKY_BASE_SIZE);
    expect(getStickyCreationSize(-2).size).toBe(STICKY_BASE_SIZE);
  });
});
