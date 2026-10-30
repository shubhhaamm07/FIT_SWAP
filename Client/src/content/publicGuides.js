export const publicGuides = {
  "/how-it-works": {
    eyebrow: "The membership journey", title: "Keep your membership value moving.",
    intro: "Browse without an account. Sign in when you are ready to list a pass, save a listing, buy a plan or request a transfer.",
    sections: [
      { title: "1. Compare the actual pass", text: "Open a listing to see the gym, plan, asking price, remaining days and expiry date. A transferred membership keeps its original end date; buying it does not restart the plan." },
      { title: "2. Check transfer eligibility", text: "The membership must belong to the seller, be active and unexpired, and be attached to an approved gym. The plan controls whether transfers are allowed, the minimum time remaining, transfer limits and permitted payment methods." },
      { title: "3. Request a handover", text: "Sign in to start an available payment or cash handover flow. For the manual UPI pilot, the QR sends the listed amount directly to the seller. Submit the transaction reference from your UPI app after paying." },
      { title: "4. Complete the required approvals", text: "The seller checks the payment in their own bank or UPI app. If the plan requires gym approval, the gym must approve the handover too. Follow the recorded request status and confirm completion before using the membership." },
    ],
  },
  "/transfer-guide": {
    eyebrow: "Eligibility & verification", title: "Know what is checked before a handover.",
    intro: "FitSwap is an online membership marketplace. Each gym and plan has its own access rules and transfer conditions.",
    sections: [
      { title: "What an approved gym means", text: "The public directory shows gyms with APPROVED status in FitSwap. Gym owners can submit verification documents for administrator review. Approval is a platform status; it is not a guarantee of equipment quality, opening hours or future service. Confirm important facility details directly with the gym." },
      { title: "Which memberships are eligible?", text: "The seller must own an active, unexpired membership at an approved gym. Its plan must permit transfers. Minimum remaining days, previous transfer counts, payment methods and an existing active listing can affect eligibility. Checks are repeated when a handover starts." },
      { title: "When does the gym approve?", text: "A plan can require gym approval after the seller confirms payment or a cash handover. Other plans complete after seller confirmation and policy checks. Review the approval requirement on the individual listing." },
      { title: "What remains unchanged?", text: "A resale passes the remaining membership time to the buyer. It does not extend the original expiry date or add benefits that the plan does not include. Ask the gym about classes, branch access, freezes and other restrictions before paying." },
      { title: "What does verification not establish?", text: "A marketplace listing is not an independent identity, equipment or service-quality guarantee. Check the listing identity, plan terms, gym details and recipient before sending a payment. Report conflicting information to support." },
    ],
  },
  "/fees-and-payments": {
    eyebrow: "Costs & payment handling", title: "See where your payment goes.",
    intro: "The current manual UPI pilot sends money directly to the seller for a resale, or to the gym for a fresh membership. FitSwap records the request and approvals.",
    sections: [
      { title: "What is payable in the manual UPI pilot?", text: "A resale UPI request uses the seller's listed asking price. The pilot does not collect a platform or gym fee in that request. Plans can store a transfer-fee policy; confirm any separate gym charges and access conditions with the gym before committing. The exact amount and recipient are shown at checkout." },
      { title: "How is payment confirmed?", text: "After paying in your UPI app, enter the UTR or transaction reference in FitSwap. The recipient checks their actual bank or UPI account before confirming. A submitted reference alone does not confirm that money was received." },
      { title: "Is this escrow or a payment guarantee?", text: "The manual flow is a direct payment to the recipient. FitSwap does not hold that payment in escrow or provide an automatic refund guarantee. Membership ownership changes only when the required confirmations and policy checks succeed." },
      { title: "Can I cancel a request?", text: "An unpaid request can be cancelled while the cancellation control is available. Cancelling a FitSwap request does not reverse a bank transfer. If you already paid, do not assume cancellation or rejection refunds your money." },
      { title: "What if a payment or transfer is disputed?", text: "Contact support with the listing or request ID, amount, payment date, UTR and relevant screenshots. Contact the recipient and your payment provider for payment investigation or reversal options. Refund eligibility and processing require case review; no fixed refund timeline is promised here. Never share passwords, OTPs or UPI PINs." },
      { title: "Are cash handovers available?", text: "Only plans that permit cash transfers show that option. Arrange payment with the seller, then complete seller confirmation and any required gym approval. Confirm the amount and terms in advance." },
    ],
  },
  "/help": {
    eyebrow: "FitSwap support", title: "A clear next step when you need help.",
    intro: "Email support@fitswap.in for account, listing and transfer questions. Signed-in members can also create and follow a support ticket from their account.",
    sections: [
      { title: "What should I include in a support request?", text: "Include your account email, the gym name, listing or request ID and a short explanation of what happened. For payment issues include the amount, date and UTR. Do not send passwords, OTPs, card security codes or UPI PINs." },
      { title: "Where is FitSwap available?", text: "FitSwap displays Indian gym locations and prices in INR. Availability depends on the approved gyms and active listings currently shown in the directory and marketplace. We do not claim coverage in every city." },
      { title: "Who handles my request?", text: "FitSwap support handles platform and account questions. The gym controls its facilities, opening hours, membership benefits and plan policies. Payment recipients confirm incoming payments; contact your payment provider for banking issues." },
      { title: "Why can't I transfer a membership?", text: "It may be expired, inactive, non-transferable, below the plan's minimum remaining days, over its transfer limit or already listed. Review the membership's eligibility result and contact the gym if its policy is unclear." },
    ],
  },
  "/terms": {
    eyebrow: "Review draft · not final legal terms", title: "Service terms for review.", draft: true,
    intro: "This draft describes the current product workflow. It needs owner approval before it can serve as final contractual terms. It does not establish a new refund entitlement, service guarantee or legal jurisdiction.",
    sections: [
      { title: "Marketplace role", text: "FitSwap lets members browse, list and request transfers of eligible gym memberships. Gyms set plan benefits, validity and transfer policies. Public browsing is available without signing in; account and transaction actions require authentication." },
      { title: "Listing and handover information", text: "Members should provide accurate membership information, list only passes they own and review the specific gym and plan conditions before requesting a handover. A transferred plan retains its original expiry date." },
      { title: "Payments and approvals", text: "The manual UPI pilot pays the recipient directly. Entering a UTR does not itself complete a transfer. Seller confirmation and any required gym approval must finish before ownership changes. See Fees and payments for the current operational details." },
      { title: "Items requiring owner approval", text: "Final legal entity details, contractual eligibility, dispute procedures, refund terms, retention commitments and applicable law must be confirmed by the service owner. Contact FitSwap support for clarification before relying on this draft." },
    ],
  },
  "/privacy": {
    eyebrow: "Review draft · not final legal notice", title: "Privacy information for review.", draft: true,
    intro: "This draft describes data used by the current app. The service owner must confirm the final controller identity, retention periods, provider disclosures and rights-request process before publication as a final privacy notice.",
    sections: [
      { title: "Account and membership information", text: "Account forms collect information such as your name, email and phone number. The app uses account sessions, membership details, listings and transfer requests to provide its features. Optional profile information is controlled through account settings." },
      { title: "Payment and support records", text: "The manual UPI workflow records payment-request information and transaction references. Support tickets can contain the information you submit about an issue. Do not provide your UPI PIN, bank password or OTP." },
      { title: "Local preferences and external services", text: "The website stores appearance preferences locally and uses session cookies for sign-in. Google sign-in is available when configured. Some gym images are served by external hosts. Location is requested through the browser only when you choose a nearby or distance feature." },
      { title: "Questions and requests", text: "Email support@fitswap.in with privacy questions. Final response procedures, retention periods and a complete service-provider inventory still need confirmation by the service owner; this draft does not promise a specific deletion or response timeline." },
    ],
  },
};
