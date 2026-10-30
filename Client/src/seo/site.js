export const siteName = "FitSwap";
export const supportEmail = "support@fitswap.in";

// Never infer a production domain from the visitor's host or an email address.
export function normalizeSiteUrl(value) {
  if (!value) return "";
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash
    || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname) || url.hostname.endsWith(".localhost")) {
    throw new Error("VITE_SITE_URL must be your public HTTPS origin, without a path, query, or credentials.");
  }
  return url.origin;
}

export const siteUrl = normalizeSiteUrl(import.meta.env?.VITE_SITE_URL || "https://fitswapp.netlify.app");

export const publicPages = {
  "/": { title: "FitSwap | Buy & Sell Gym Memberships in India", description: "Buy, sell and transfer eligible gym memberships with FitSwap. Compare available passes, explore partner gyms and follow a clear membership handover process." },
  "/marketplace": { title: "Gym Membership Marketplace | FitSwap", description: "Browse gym memberships for resale. Compare asking prices, remaining validity and plan transfer conditions before signing in to start a handover." },
  "/gyms": { title: "Explore Partner Gyms & Membership Plans | FitSwap", description: "Explore approved FitSwap partner gyms, their locations and published membership plans. Check gym details before choosing your next membership." },
  "/how-it-works": { title: "How Gym Membership Transfers Work | FitSwap", description: "Learn how to list an eligible gym membership, request a transfer, confirm payment and complete the approvals required by the plan." },
  "/transfer-guide": { title: "Eligibility, Verification & Transfer Rules | FitSwap", description: "Understand membership eligibility, gym approval, remaining validity and the checks used during a FitSwap transfer." },
  "/fees-and-payments": { title: "Fees, UPI Payments & Disputes | FitSwap", description: "See how FitSwap's manual UPI pilot works, what you pay, how approvals affect a transfer and where to ask for help with a payment dispute." },
  "/help": { title: "Help & Contact Support | FitSwap", description: "Contact FitSwap support and find answers about listings, membership transfers, gym approval and payment issues." },
  "/terms": { title: "Service Terms — Review Draft | FitSwap", description: "Review draft of FitSwap service terms for the current membership marketplace and manual payment workflow.", noindex: true },
  "/privacy": { title: "Privacy Notice — Review Draft | FitSwap", description: "Review draft describing account data, membership records, payment references and support information used by FitSwap.", noindex: true },
};

const accountPages = {
  "/login": "Sign In", "/register": "Create an Account", "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password", "/verify-email": "Verify Your Email", "/admin/mfa": "Administrator Verification",
};

export function metadataForPath(path) {
  return publicPages[path] || {
    title: `${accountPages[path] || "Your Account"} | FitSwap`,
    description: "Manage your FitSwap account and gym memberships.",
    noindex: true,
  };
}

export function organizationSchema(origin = siteUrl) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": origin ? `${origin}/#organization` : "#organization", name: siteName, ...(origin ? { url: origin } : {}), email: supportEmail, description: "An online marketplace for eligible gym membership resale and transfers." },
      { "@type": "WebSite", "@id": origin ? `${origin}/#website` : "#website", name: siteName, ...(origin ? { url: origin } : {}), inLanguage: "en-IN", publisher: { "@id": origin ? `${origin}/#organization` : "#organization" } },
    ],
  };
}
