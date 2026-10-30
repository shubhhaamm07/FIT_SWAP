const test = require("node:test");
const assert = require("node:assert/strict");
const { canAccess } = require("../src/routes/role-policy.cjs");
const { coordinates, distanceKm } = require("../src/utils/location.cjs");
test("role navigation never exposes admin or owner pages to a member", () => {
  assert.equal(canAccess("USER", "Admin"), false);
  assert.equal(canAccess("USER", "Owner"), false);
  assert.equal(canAccess("GYM_OWNER", "Admin"), false);
  assert.equal(canAccess("ADMIN", "Owner"), false);
  assert.equal(canAccess("ADMIN", "Admin"), true);
  assert.equal(canAccess("GYM_OWNER", "Owner"), true);
  assert.equal(canAccess("ADMIN", "Diet"), false);
  assert.equal(canAccess("USER", "Diet"), true);
});
test("coordinates reject missing or out-of-range values without treating them as zero", () => {
  assert.equal(coordinates({ latitude: "", longitude: 0 }), null);
  assert.equal(coordinates({ latitude: 91, longitude: 0 }), null);
  assert.deepEqual(coordinates({ latitude: "0", longitude: "0" }), {
    latitude: 0,
    longitude: 0,
  });
});
test("nearby distances remain valid across the date line and identical locations", () => {
  const p = { latitude: 30.741, longitude: 76.782 };
  assert.equal(distanceKm(p, p), 0);
  const distance = distanceKm(
    { latitude: 0, longitude: 179.9 },
    { latitude: 0, longitude: -179.9 },
  );
  assert.ok(distance > 20 && distance < 23);
});
const { resolveLayout } = require("../src/utils/responsive.cjs");
test("responsive layouts account for tablet navigation and readable card widths", () => {
  for (const width of [320, 375, 430, 650, 768, 1024, 1440]) {
    const layout = resolveLayout(width, 900);
    const cardWidth =
      (layout.contentWidth - 2 * layout.gutter) / layout.columns - 14;
    assert.ok(cardWidth >= 240, `Card width at ${width}px is ${cardWidth}`);
  }
  assert.equal(resolveLayout(375, 800).columns, 1);
  assert.equal(resolveLayout(768, 1024).compact, true);
  assert.equal(resolveLayout(1440, 900).columns, 3);
});
test("larger accessibility text reduces density instead of squeezing columns", () => {
  assert.equal(resolveLayout(768, 1024, 2).tablet, false);
  assert.equal(resolveLayout(900, 1024, 2).columns, 1);
});
