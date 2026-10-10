/** Offset a rectangle with 45° cuts at the top-left and bottom-right.
 * Moving a diagonal inward by `inset` increases x+y by sqrt(2)*inset.
 * This keeps the perpendicular gap equal to the gap along the straight edges.
 */
export function mediaContour(width: number, height: number, cut: number, inset = 0) {
  const innerCut = Math.max(0, cut - (2 - Math.SQRT2) * inset);
  const points = [
    [inset + innerCut, inset],
    [width - inset, inset],
    [width - inset, height - inset - innerCut],
    [width - inset - innerCut, height - inset],
    [inset, height - inset],
    [inset, inset + innerCut],
  ];
  return {
    path: `M${points.map(([x, y]) => `${x},${y}`).join('L')}Z`,
    polygon: `polygon(${points.map(([x, y]) => `${x - inset}px ${y - inset}px`).join(',')})`,
  };
}
