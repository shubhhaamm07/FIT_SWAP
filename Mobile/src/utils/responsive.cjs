function resolveLayout(width, height, fontScale = 1) {
  const scale = Math.max(1, fontScale / 1.3);
  const tablet = width / scale >= 768;
  const contentWidth = width - (tablet ? 180 : 0);
  const readableWidth = contentWidth / scale;
  return {
    width,
    height,
    fontScale,
    contentWidth,
    compact: readableWidth < 600,
    tablet,
    wide: readableWidth >= 1100,
    columns: readableWidth >= 1100 ? 3 : readableWidth >= 650 ? 2 : 1,
    gutter: readableWidth < 400 ? 16 : readableWidth < 768 ? 22 : 32,
  };
}
module.exports = { resolveLayout };
