/** Relative luminance (WCAG) of a #rrggbb / #rgb color. */
function luminance(hex) {
  let raw = String(hex || '').replace('#', '').trim();
  if (raw.length === 3) raw = raw.split('').map((c) => c + c).join('');
  if (raw.length < 6) return 0;
  const channel = (i) => {
    const v = parseInt(raw.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

const LIGHT = '#ffffff';
const DARK = '#19191f';

/**
 * Black or white — whichever is easier to read on this background.
 * Used for the letter on project color tiles, where the color is chosen by a
 * person and can be anything from near-black to bright orange.
 */
export function readableTextOn(background) {
  const l = luminance(background);
  const onWhite = 1.05 / (l + 0.05);
  const onDark = (l + 0.05) / (luminance(DARK) + 0.05);
  return onDark > onWhite ? DARK : LIGHT;
}
