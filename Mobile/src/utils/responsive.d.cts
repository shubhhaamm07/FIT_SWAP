export function resolveLayout(
  width: number,
  height: number,
  fontScale?: number,
): {
  width: number;
  height: number;
  fontScale: number;
  contentWidth: number;
  compact: boolean;
  tablet: boolean;
  wide: boolean;
  columns: number;
  gutter: number;
};
