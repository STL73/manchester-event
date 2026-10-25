// Row layout for a honeycomb of hexagons. Neighbouring rows differ by one
// cell, so a centred row nests into the gaps of the row above it.

// Each row is { slots, filled }: a short last row keeps its slot count
// (the empty slots are drawn invisible) so it still nests under the row
// above. maxPerRow is how many cells fit across, at least 2
export function honeycombRows(count, maxPerRow) {
  if (count <= maxPerRow) return [{ slots: count, filled: count }];

  // A centred hexagonal number (7, 19, 37...) with room for its middle row
  // makes one big hexagon: 19 is 3-4-5-4-3
  const rings = (Math.sqrt(12 * count - 3) - 3) / 6;
  if (Number.isInteger(rings) && 2 * rings + 1 <= maxPerRow) {
    const sizes = [];
    for (let size = rings + 1; size <= 2 * rings + 1; size++) sizes.push(size);
    for (let size = 2 * rings; size >= rings + 1; size--) sizes.push(size);
    return sizes.map((size) => ({ slots: size, filled: size }));
  }

  // Otherwise rows alternate between n and n-1. Start with whichever gives
  // a full last row; if neither does, start with the wide row
  const alternating = (first) => {
    const rows = [];
    let left = count;
    let size = first;
    while (left > 0) {
      rows.push({ slots: size, filled: Math.min(size, left) });
      left -= size;
      size = size === maxPerRow ? maxPerRow - 1 : maxPerRow;
    }
    return rows;
  };
  const isFull = (rows) => rows.at(-1).slots === rows.at(-1).filled;

  const narrowFirst = alternating(maxPerRow - 1);
  if (isFull(narrowFirst)) return narrowFirst;
  const wideFirst = alternating(maxPerRow);

  // A last row two or more cells short of the one above looks broken
  // (12 was 4-3-4-1). A hill fills every row instead, 12 becoming 2-3-4-3,
  // but only when it needs no more rows, so the panel doesn't grow
  // (decided 2026-10-25)
  const [above, last] = wideFirst.slice(-2);
  const shape = hill(count, maxPerRow);
  if (above.slots - last.filled >= 2 && shape && shape.length <= wideFirst.length) {
    return shape.map((size) => ({ slots: size, filled: size }));
  }
  return wideFirst;
}

// Rows that grow by one cell to a peak, then shrink by one: every row full.
// Fewest rows first, then the most even ends, then the narrower end on top.
// Null when no hill adds up to the count
function hill(count, maxPerRow) {
  let best = null;
  for (let peak = 2; peak <= maxPerRow; peak++) {
    for (let top = 1; top <= peak; top++) {
      for (let bottom = 1; bottom <= peak; bottom++) {
        const sizes = [];
        for (let size = top; size <= peak; size++) sizes.push(size);
        for (let size = peak - 1; size >= bottom; size--) sizes.push(size);
        if (sizes.reduce((sum, size) => sum + size, 0) !== count) continue;
        const score = [sizes.length, Math.abs(top - bottom), top];
        const differs = best && score.findIndex((value, i) => value !== best.score[i]);
        if (!best || (differs !== -1 && score[differs] < best.score[differs])) {
          best = { sizes, score };
        }
      }
    }
  }
  return best && best.sizes;
}
