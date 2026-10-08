export const STICKY_BASE_SIZE = 100;
export const STICKY_BASE_FONT_SIZE = 14;
export const STICKY_MIN_SIZE = 50;
export const STICKY_MAX_SIZE = 600;
export const STICKY_MIN_FONT_SIZE = 10;
export const STICKY_MAX_FONT_SIZE = 72;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getStickyCreationSize = (
  zoom: number,
): { size: number; fontSize: number } => {
  const safeZoom = zoom > 0 ? zoom : 1;
  const size = Math.round(
    clamp(STICKY_BASE_SIZE / safeZoom, STICKY_MIN_SIZE, STICKY_MAX_SIZE),
  );
  const fontSize = Math.round(
    clamp(
      (size * STICKY_BASE_FONT_SIZE) / STICKY_BASE_SIZE,
      STICKY_MIN_FONT_SIZE,
      STICKY_MAX_FONT_SIZE,
    ),
  );
  return { size, fontSize };
};
