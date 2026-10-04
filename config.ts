// ====== EDIT THIS FILE: all your personal details live here ======
export const CONFIG = {
  brand: "ProMaazEdits",
  instructorName: "Maaz",
  businessEmail: "[ADD YOUR BUSINESS EMAIL]", // shown on the policy pages
  instructorBio: "Maaz teaches CapCut mobile editing in a simple, step-by-step and beginner-friendly way. This course is designed so that even someone with no previous editing experience can easily understand the lessons and start creating professional-looking videos on a mobile phone.",
  price: "999",
  originalPrice: "", // not provided yet; the strikethrough price is hidden while empty,
  bonus: "", // not provided yet; hidden while empty,
  paymentLink: "[PAYMENT LINK / RAZORPAY LINK]",
  accessPolicy: "Yes, you will get lifetime access to the course.",
  refundPolicy: "No. There is no refund policy for this course. All purchases are final.",
  socials: {
    Instagram: "https://instagram.com/Promaazedits",
    YouTube: "" // add link to show,
    Telegram: "" // add link to show,
    WhatsApp: "" // add https://wa.me/91XXXXXXXXXX to show
  },
  legal: { contact: "mailto:getfitwithmaaz101@gmail.com", terms: "/terms-and-conditions", privacy: "/privacy-policy", refund: "/refund-policy" },
};
// Placeholders (starting with "[") become "#" so nothing breaks before you fill them in.
export const href = (u: string) => (u.startsWith("[") ? "#" : u);
