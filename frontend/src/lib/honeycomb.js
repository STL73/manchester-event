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
  return alternating(maxPerRow);
}
