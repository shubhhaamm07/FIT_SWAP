const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const daysLeft = (date) =>
  Math.max(
    0,
    Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) || 0,
  );
const dateLabel = (date) =>
  Number.isNaN(new Date(date).getTime())
    ? "Unavailable"
    : new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
const discount = (price, original) =>
  Number(original) > 0
    ? Math.max(0, Math.round((1 - Number(price) / Number(original)) * 100))
    : 0;
module.exports = { money, daysLeft, dateLabel, discount };
