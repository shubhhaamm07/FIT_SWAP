const test = require("node:test");
const assert = require("node:assert/strict");
const {
  money,
  daysLeft,
  dateLabel,
  discount,
} = require("../src/utils/format.cjs");
test("expired memberships never display negative remaining time", () => {
  assert.equal(daysLeft("2020-01-01"), 0);
  assert.equal(daysLeft("bad-date"), 0);
  assert.equal(daysLeft(new Date(Date.now() + 86400000).toISOString()), 1);
});
test("prices use Indian rupees and discounts cannot become negative", () => {
  assert.match(money("4500"), /4,500/);
  assert.match(money(4500), /₹/);
  assert.equal(discount(4500, 9000), 50);
  assert.equal(discount(12000, 9000), 0);
  assert.equal(discount(100, 0), 0);
  assert.equal(dateLabel("invalid"), "Unavailable");
});
