export const passwordPolicyMessage = (password, identity = {}) => {
  if (typeof password !== "string" || password.length < 12) {
    return "Password must contain at least 12 characters.";
  }
  if (password.length > 128) {
    return "Password must contain no more than 128 characters.";
  }

  const groups = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/]
    .filter((pattern) => pattern.test(password)).length;
  if (groups < 3) {
    return "Use at least three of: lowercase, uppercase, numbers, and symbols.";
  }

  const normalized = password.toLowerCase();
  const identityParts = [
    String(identity.email || "").split("@")[0],
    identity.firstName,
    identity.lastName,
    identity.username,
  ].map((value) => String(value || "").trim().toLowerCase()).filter((value) => value.length >= 3);
  if (identityParts.some((value) => normalized.includes(value))) {
    return "Password must not contain your name, username, or email address.";
  }
  return "";
};
