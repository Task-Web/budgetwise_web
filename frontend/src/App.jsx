import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./apiClient";

// Cookie configuration for user identity
const COOKIE_NAME = import.meta.env.VITE_COOKIE_NAME || "user_id";
const COOKIE_MAX_AGE = Number(import.meta.env.VITE_COOKIE_MAX_AGE || 60 * 60 * 24 * 30);

// This function checks the URL for a "cookie" query parameter,
// sets the cookie accordingly, and redirects to clean URL
// When building on basesite, this function MUST remain unchanged
const applyCookieFromQuery = () => {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  const override = url.searchParams.get("cookie");
  if (!override) return false;
  let cookie = `${COOKIE_NAME}=${encodeURIComponent(override)}; Path=/; SameSite=Lax`;
  if (Number.isFinite(COOKIE_MAX_AGE) && COOKIE_MAX_AGE > 0) {
    cookie += `; Max-Age=${Math.floor(COOKIE_MAX_AGE)}`;
  }
  document.cookie = cookie;
  // Remove the cookie param from URL and redirect
  url.searchParams.delete("cookie");
  const redirectUrl = url.toString();
  if (window.location.href !== redirectUrl) {
    window.location.replace(redirectUrl);
    return true;
  }
  return false;
};

const PLAN_TERMS = ["3", "6", "12"];
const PLAN_IDS = ["5gb", "15gb", "20gb", "unlimited"];
const PLAN_LABELS = {
  "5gb": "5GB",
  "15gb": "15GB",
  "20gb": "20GB",
  unlimited: "Unlimited",
};
const PROMO_LABELS = {
  "3": "6% OFF",
  "6": "12% OFF",
  "12": "18% OFF",
};
const PROMO_CODE = "BUDGETWISE";
const PROMO_DISCOUNT_PERCENT = 5;
const PLAN_CATALOG = {
  "3": {
    "5gb": {
      sku: "BUDGETWISE-SMALL-03",
      label: "5GB",
      data: "5",
      monthly: 30,
      upfront: 90,
      strike: 35,
      introMonthly: 30,
      renewalMonthly: 35,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.82",
        "Federal Universal Svc Fund": "$0.11",
        "Recovery Fee": "1.88",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "5", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000735N0005E",
    },
    "15gb": {
      sku: "BUDGETWISE-MEDIUM-03",
      label: "15GB",
      data: "15",
      monthly: 40,
      upfront: 120,
      strike: 45,
      introMonthly: 40,
      renewalMonthly: 45,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.82",
        "Federal Universal Svc Fund": "$0.15",
        "Recovery Fee": "$2.08",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "15", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000736N0004E",
    },
    "20gb": {
      sku: "BUDGETWISE-LARGE-03",
      label: "20GB",
      data: "20",
      monthly: 45,
      upfront: 135,
      strike: 50,
      introMonthly: 45,
      renewalMonthly: 50,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.82",
        "Federal Universal Svc Fund": "$0.18",
        "Recovery Fee": "$2.29",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "20", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000737N0004E",
    },
    unlimited: {
      sku: "BUDGETWISE-UNLIMITED-03",
      label: "UNLTD*",
      data: "UNLIMITED",
      monthly: 80,
      upfront: 240,
      strike: 85,
      introMonthly: 80,
      renewalMonthly: 85,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.82",
        "Federal Universal Svc Fund": "$0.22",
        "Recovery Fee": "$2.58",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "Unlimited", units: "" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007001067N0002E",
    },
  },
  "6": {
    "5gb": {
      sku: "BUDGETWISE-SMALL-06",
      label: "5GB",
      data: "5",
      monthly: 25,
      upfront: 150,
      strike: 35,
      introMonthly: 25,
      renewalMonthly: 35,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.41",
        "Federal Universal Svc Fund": "$0.14",
        "Recovery Fee": "$1.75",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "5", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000738N0004G",
    },
    "15gb": {
      sku: "BUDGETWISE-MEDIUM-06",
      label: "15GB",
      data: "15",
      monthly: 35,
      upfront: 210,
      strike: 45,
      introMonthly: 35,
      renewalMonthly: 45,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.41",
        "Federal Universal Svc Fund": "$0.18",
        "Recovery Fee": "$1.92",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "15", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000739N0004G",
    },
    "20gb": {
      sku: "BUDGETWISE-LARGE-06",
      label: "20GB",
      data: "20",
      monthly: 40,
      upfront: 240,
      strike: 50,
      introMonthly: 40,
      renewalMonthly: 50,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.46",
        "Federal Universal Svc Fund": "$0.25",
        "Recovery Fee": "$2.21",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "20", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000740N0004G",
    },
    unlimited: {
      sku: "BUDGETWISE-UNLIMITED-06",
      label: "UNLTD*",
      data: "UNLIMITED",
      monthly: 75,
      upfront: 450,
      strike: 85,
      introMonthly: 75,
      renewalMonthly: 85,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.46",
        "Federal Universal Svc Fund": "$0.25",
        "Recovery Fee": "$2.33",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "Unlimited", units: "" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007001072N0001E",
    },
  },
  "12": {
    "5gb": {
      sku: "BUDGETWISE-SMALL-12",
      label: "5GB",
      data: "5",
      monthly: 20,
      upfront: 240,
      strike: 35,
      introMonthly: 20,
      renewalMonthly: 35,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.21",
        "Federal Universal Svc Fund": "$0.11",
        "Recovery Fee": "$1.54",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "5", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000741N0004G",
    },
    "15gb": {
      sku: "BUDGETWISE-MEDIUM-12",
      label: "15GB",
      data: "15",
      monthly: 30,
      upfront: 360,
      strike: 45,
      introMonthly: 30,
      renewalMonthly: 45,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.27",
        "Federal Universal Svc Fund": "$0.14",
        "Recovery Fee": "$1.71",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "15", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000742N0004G",
    },
    "20gb": {
      sku: "BUDGETWISE-LARGE-12",
      label: "20GB",
      data: "20",
      monthly: 35,
      upfront: 420,
      strike: 50,
      introMonthly: 35,
      renewalMonthly: 50,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.33",
        "Federal Universal Svc Fund": "$0.18",
        "Recovery Fee": "$1.85",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "20", units: "GB" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007000743N0004G",
    },
    unlimited: {
      sku: "BUDGETWISE-UNLIMITED-12",
      label: "UNLTD*",
      data: "UNLIMITED",
      monthly: 70,
      upfront: 840,
      strike: 85,
      introMonthly: 70,
      renewalMonthly: 85,
      providerMonthlyFees: {
        "Other Govt Fees": "Up to $0.40",
        "Federal Universal Svc Fund": "$0.21",
        "Recovery Fee": "$2.10",
        "Federal Cost Recovery Fee": "$0.01",
      },
      typicalSpeed: {
        upload: { range: [6, 30], units: "Mbps" },
        download: { range: [79, 357], units: "Mbps" },
        latency: { range: [17, 32], units: "ms" },
      },
      dataIncluded: { amount: "Unlimited", units: "" },
      support: { number: "(800) 683-7392", URL: "https://www.budgetwise.com/help-center/" },
      networkManagementPolicyURL: "https://www.budgetwise.com/network-management-policy/",
      privacyPolicyURL: "https://www.budgetwise.com/privacy-policy/",
      labelId: "M0028706406007001077N0003E",
    },
  },
};

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

const FEATURE_ITEMS = [
  { text: "Coverage on the Nation's Largest 5G Network", type: "positive" },
  { text: "High-Speed Data", type: "positive" },
  { text: "Award-Winning Customer Care", type: "positive" },
  { text: "Unlimited Talk and Text", type: "positive" },
  { text: "No Mobile Hotspot", type: "warning" },
  { text: "No Calling to Mexico and Canada", type: "warning" },
];

const HERO_COPY = "Pay upfront for bigger savings on your plan";
const HERO_LEGAL =
  "Upfront payment for applicable plan term required (each equiv. to $15/mo). " +
  "New customer offer for initial plan term only; then full-price plan options available. " +
  "Taxes and fees extra. Unlimited customers using over 50GB/mo may experience lower speeds " +
  "during times of network congestion. Video streams at 480p. Availability, speed and coverage " +
  "vary by location.";
const FAQ_ITEMS = [
  {
    id: "byop",
    question: "Can I bring my own phone?",
    answer:
      "Yes. With our Bring Your Own Phone program, you can use an unlocked compatible phone. " +
      "Swap the SIM card, or choose eSIM for instant activation. Compatible devices include most " +
      "unlocked GSM phones, plus unlocked AT&T, T-Mobile, Cricket Wireless, Simple Mobile, and " +
      "Straight Talk phones.",
  },
  {
    id: "esim",
    question: "What is an eSIM and how do I get one?",
    answer:
      "An eSIM is a digital SIM. Instead of inserting a card, you install an eSIM on your phone so " +
      "you can activate right after purchase. If your phone is unlocked and eligible, select eSIM " +
      "during checkout.",
  },
  {
    id: "change-plan",
    question: "Can I change my plan?",
    answer:
      "You can move to a higher data amount at any time, or to a lower data amount at renewal. " +
      "Plan duration changes happen at renewal through your account.",
  },
  {
    id: "multi-plan",
    question: "Can I purchase more than one plan at a time?",
    answer:
      "Yes. Purchase up to 5 plans per order. Each plan requires a new activation, so you can " +
      "share the deal with friends and family.",
  },
  {
    id: "money-back",
    question: "What is BudgetWise's 7-Day Money Back Guarantee refund policy?",
    answer:
      "You can cancel within 7 days of activation for a full refund of the plan price, fees, and " +
      "taxes (shipping is not refunded). Unused SIM cards can be returned within 10 days if they " +
      "are unopened and unactivated.",
  },
  {
    id: "intro-price",
    question:
      "If I purchased a plan at an introductory price, what will the cost of my plan be when I renew?",
    answer:
      "Renewal pricing depends on the plan term you choose. Log into your account to view options " +
      "and set your next plan duration.",
  },
];
const FAMILY_MIN_LINES = 1;
const FAMILY_MAX_LINES = 5;

// T-Mobile style plan types with different tiers
const FAMILY_PLAN_TYPES = {
  premium: {
    id: "premium",
    name: "BudgetWise Premium",
    badge: "Most value-packed",
    tagline: "Best for power users",
    color: "#3a5646", // Dark green - most premium
  },
  plus: {
    id: "plus",
    name: "BudgetWise Plus",
    badge: "Most popular",
    tagline: "Great balance of features",
    color: "#4b6f5c", // Medium green
  },
  essentials: {
    id: "essentials",
    name: "BudgetWise Essentials",
    badge: "Our lowest price",
    tagline: "Simple & affordable",
    color: "#6a8f7a", // Light green
  },
};

// T-Mobile style pricing: total monthly price based on lines and plan type
// Based on T-Mobile's actual pricing structure
// Pricing based on T-Mobile cell phone plans (https://www.t-mobile.com/cell-phone-plans)
// monthly = price with AutoPay discount ($5/line), original = full price
const FAMILY_PLAN_PRICING = {
  premium: {
    // Experience Beyond pricing (with AutoPay $5/line discount)
    // T-Mobile shows: 3rd line FREE promo applied for 3+ lines
    1: { monthly: 100, original: 105 },  // $105 - $5 = $100
    2: { monthly: 170, original: 180 },  // $180 - $10 = $170
    3: { monthly: 170, original: 230 },  // $230 original, $170 with 3rd line FREE + AutoPay
    4: { monthly: 215, original: 280 },  // $280 original, $215 with AutoPay
    5: { monthly: 260, original: 330 },  // $330 original, $260 with AutoPay
  },
  plus: {
    // Experience More pricing (with AutoPay $5/line discount)
    // T-Mobile shows: 3rd line FREE promo applied for 3+ lines
    1: { monthly: 85, original: 90 },   // $90 - $5 = $85
    2: { monthly: 140, original: 150 }, // $150 - $10 = $140
    3: { monthly: 140, original: 185 }, // $185 original, $140 with 3rd line FREE + AutoPay
    4: { monthly: 170, original: 220 }, // $220 original, $170 with AutoPay
    5: { monthly: 200, original: 255 }, // $255 original, $200 with AutoPay
  },
  essentials: {
    // Essentials pricing (with AutoPay $5/line discount)
    // T-Mobile shows: 3rd line FREE promo for 3 lines, special 4-line offer for 4+
    1: { monthly: 60, original: 65 },   // $65 - $5 = $60
    2: { monthly: 90, original: 100 },  // $100 - $10 = $90
    3: { monthly: 90, original: 120 },  // $120 original, $90 with 3rd line FREE + AutoPay
    4: { monthly: 100, original: 120 }, // Special 4-line offer: $120 original, $100 with AutoPay
    5: { monthly: 125, original: 150 }, // $150 original, $125 with AutoPay
  },
};

// Plan features for each tier
const FAMILY_PLAN_FEATURES = {
  premium: [
    { text: "5-Year Price Guarantee", highlight: true },
    { text: "Upgrade-ready every year", highlight: true },
    { text: "Unlimited premium data on 5G Network", highlight: false },
    { text: "Netflix Standard with ads ON US", highlight: false },
    { text: "Apple TV+ just $3/month", highlight: false },
    { text: "Hulu ON US", highlight: false },
    { text: "Unlimited mobile hotspot included", highlight: false },
    { text: "30GB high-speed data in Canada & Mexico", highlight: false },
    { text: "15GB high-speed data in 215+ countries", highlight: false },
    { text: "Full-flight texting and Wi-Fi", highlight: false },
  ],
  plus: [
    { text: "5-Year Price Guarantee", highlight: true },
    { text: "Upgrade-ready every 2 years", highlight: false },
    { text: "Unlimited premium data on 5G Network", highlight: false },
    { text: "Netflix Standard with ads ON US", highlight: false },
    { text: "Apple TV+ just $3/month", highlight: false },
    { text: "60GB high-speed mobile hotspot", highlight: false },
    { text: "15GB high-speed data in Canada & Mexico", highlight: false },
    { text: "5GB high-speed data in 215+ countries", highlight: false },
    { text: "Full-flight texting and Wi-Fi", highlight: false },
  ],
  essentials: [
    { text: "Unlimited talk and text", highlight: false },
    { text: "50GB premium data on 5G Network", highlight: false },
    { text: "Mobile hotspot included", highlight: false },
    { text: "International texting included", highlight: false },
  ],
};

// Additional charges info
const FAMILY_ADDITIONAL_CHARGES = {
  deviceConnection: 35,
  regulatoryFee: 3.99,
  federalSurcharge: "0.30-4.70",
};

// Broadband Facts data for each plan type (based on T-Mobile)
// These are the ORIGINAL prices without AutoPay discount
const BROADBAND_FACTS_DATA = {
  premium: {
    name: "Experience Beyond",
    prices: {
      1: 105, 2: 180, 3: 230, 4: 280, 5: 330,
    },
    additionalLines: [
      { range: "6-8 Lines", price: "$50 / line" },
      { range: "9-12 Lines", price: "$55 / line" },
    ],
    speeds: {
      download: "144-561 Mbps (5G)",
      upload: "6-34 Mbps (5G)",
      latency: "15-27 ms",
    },
    // Annual savings from T-Mobile website (per number of lines)
    annualSavingsByLines: {
      1: 396.00,
      2: 456.00,
      3: 1056.00,
      4: 1116.00,
      5: 1176.00,
    },
    annualSavings: 396.00, // Default for 1 line
  },
  plus: {
    name: "Experience More",
    prices: {
      1: 90, 2: 150, 3: 185, 4: 220, 5: 255,
    },
    additionalLines: [
      { range: "6-8 Lines", price: "$35 / line" },
      { range: "9-12 Lines", price: "$40 / line" },
    ],
    speeds: {
      download: "144-561 Mbps (5G)",
      upload: "6-34 Mbps (5G)",
      latency: "15-27 ms",
    },
    annualSavingsByLines: {
      1: 276.00,
      2: 336.00,
      3: 756.00,
      4: 816.00,
      5: 876.00,
    },
    annualSavings: 276.00,
  },
  essentials: {
    name: "Essentials 4-Line Offer",
    prices: {
      // Per T-Mobile Broadband Facts: 1-3 lines N/A, only 4+ available
      1: "N/A", 2: "N/A", 3: "N/A", 4: 120, 5: 150,
    },
    additionalLines: [
      { range: "6 Lines", price: "$180" },
    ],
    speeds: {
      download: "127-455 Mbps (5G)",
      upload: "6-33 Mbps (5G)",
      latency: "15-27 ms",
    },
    annualSavingsByLines: {
      // Per T-Mobile: Annual savings for Essentials 4-Line Offer
      1: 0,
      2: 0,
      3: 0,
      4: 240.00,
      5: 300.00,
    },
    annualSavings: 240.00,
  },
};

// Discount pricing for First Responders and Military & Veterans
// Based on T-Mobile's discount structure (https://www.t-mobile.com/cell-phone-plans)
// Prices collected from T-Mobile website on 2026-01-04
// original = T-Mobile listed price (without AutoPay), monthly = with AutoPay ($5/line discount)
const FAMILY_DISCOUNT_PRICING = {
  first_responder: {
    premium: {
      // Experience Beyond w/ First Responder Savings
      // T-Mobile verified: 1 line $90→$85, 5 lines $260→$235
      1: { monthly: 85, original: 90 },   // $90 - $5 = $85
      2: { monthly: 130, original: 140 }, // $140 - $10 = $130
      3: { monthly: 165, original: 180 }, // $180 - $15 = $165
      4: { monthly: 200, original: 220 }, // $220 - $20 = $200
      5: { monthly: 235, original: 260 }, // $260 - $25 = $235
    },
    plus: {
      // Experience More w/ First Responder Savings
      // T-Mobile verified: 2 lines $110→$100, 3 lines $135→$120, 4 lines $160→$140
      1: { monthly: 70, original: 75 },   // $75 - $5 = $70
      2: { monthly: 100, original: 110 }, // $110 - $10 = $100
      3: { monthly: 120, original: 135 }, // $135 - $15 = $120 (T-Mobile verified)
      4: { monthly: 140, original: 160 }, // $160 - $20 = $140 (T-Mobile verified)
      5: { monthly: 160, original: 185 }, // $185 - $25 = $160
    },
    essentials: {
      // Essentials First Responder
      // T-Mobile verified: 2 lines $90→$80, 3 lines $105→$90
      1: { monthly: 45, original: 50 },   // $50 - $5 = $45
      2: { monthly: 80, original: 90 },   // $90 - $10 = $80
      3: { monthly: 90, original: 105 },  // $105 - $15 = $90 (T-Mobile verified)
      4: { monthly: 100, original: 120 }, // $120 - $20 = $100
      5: { monthly: 110, original: 135 }, // $135 - $25 = $110
    },
  },
  military: {
    premium: {
      // Military & Veteran Savings (same pricing as First Responder)
      1: { monthly: 85, original: 90 },
      2: { monthly: 130, original: 140 },
      3: { monthly: 165, original: 180 },
      4: { monthly: 200, original: 220 },
      5: { monthly: 235, original: 260 },
    },
    plus: {
      // Same as First Responder - T-Mobile: 2 lines $110→$100, 3 lines $135→$120, 4 lines $160→$140
      1: { monthly: 70, original: 75 },
      2: { monthly: 100, original: 110 },
      3: { monthly: 120, original: 135 },
      4: { monthly: 140, original: 160 },
      5: { monthly: 160, original: 185 },
    },
    essentials: {
      // Same as First Responder - T-Mobile: 2 lines $90→$80, 3 lines $105→$90
      1: { monthly: 45, original: 50 },
      2: { monthly: 80, original: 90 },
      3: { monthly: 90, original: 105 },
      4: { monthly: 100, original: 120 },
      5: { monthly: 110, original: 135 },
    },
  },
};

const DISCOUNT_LABELS = {
  first_responder: "First Responder Savings",
  military: "Military & Veteran Savings",
};

// Annual Savings for First Responders and Military (from T-Mobile website)
// These are the fixed values shown on T-Mobile's website, not calculated
const DISCOUNT_ANNUAL_SAVINGS = {
  first_responder: {
    premium: {
      // Experience Beyond w/ First Responder Savings
      1: 276.00,  // T-Mobile: $276.00
      2: 456.00,  // T-Mobile: $456.00
      3: 516.00,  // T-Mobile: $516.00
      4: 576.00,  // T-Mobile: $576.00
      5: 636.00,  // T-Mobile: $636.00
    },
    plus: {
      // Experience More w/ First Responder Savings
      1: 156.00,  // T-Mobile: $156.00
      2: 336.00,  // T-Mobile: $336.00
      3: 396.00,  // T-Mobile: $396.00
      4: 456.00,  // T-Mobile: $456.00
      5: 516.00,  // T-Mobile: $516.00
    },
    essentials: {
      // Essentials First Responder
      1: 60.00,   // T-Mobile: $60.00
      2: 120.00,  // T-Mobile: $120.00
      3: 180.00,  // T-Mobile: $180.00
      4: 240.00,  // T-Mobile: $240.00
      5: 300.00,  // T-Mobile: $300.00
    },
  },
  military: {
    // Military & Veteran Savings (same as First Responder)
    premium: {
      1: 276.00,
      2: 456.00,
      3: 516.00,
      4: 576.00,
      5: 636.00,
    },
    plus: {
      1: 156.00,
      2: 336.00,
      3: 396.00,
      4: 456.00,
      5: 516.00,
    },
    essentials: {
      1: 60.00,
      2: 120.00,
      3: 180.00,
      4: 240.00,
      5: 300.00,
    },
  },
};

// Helper function to get family pricing with optional discount
const getFamilyPricing = (planType, lines, discountType = "") => {
  // Return null/zero values if no plan type selected
  if (!planType || !FAMILY_PLAN_PRICING[planType]) {
    return {
      monthly: 0,
      original: 0,
      perLine: 0,
      originalPerLine: 0,
      savings: 0,
      annualSavings: 0,
    };
  }
  
  // Use discount pricing if applicable
  let pricing;
  if (discountType && FAMILY_DISCOUNT_PRICING[discountType]?.[planType]?.[lines]) {
    pricing = FAMILY_DISCOUNT_PRICING[discountType][planType][lines];
  } else {
    pricing = FAMILY_PLAN_PRICING[planType]?.[lines] || FAMILY_PLAN_PRICING[planType][1];
  }
  
  const perLine = pricing.monthly / lines;
  const originalPerLine = pricing.original / lines;
  return {
    monthly: pricing.monthly,
    original: pricing.original,
    perLine,
    originalPerLine,
    savings: pricing.original - pricing.monthly,
    annualSavings: (pricing.original - pricing.monthly) * 12,
  };
};
const FACTS_PLANS = PLAN_IDS.map((id) => ({ id, label: PLAN_LABELS[id] }));

const FOOTER_GROUPS = [
  {
    title: "Shop",
    links: [
      "Phone Plans",
      "Phones",
      "Deals",
      "BudgetWise Kids",
      "BudgetWise 55+",
      "Unlimited Phone Plan",
      "5G Home Internet",
      "Shop Phones By Brand",
      "Apple Phones",
      "Samsung Phones",
    ],
  },
  {
    title: "Service Features",
    links: [
      "5G Coverage",
      "What is 5G?",
      "Family Phone Plans",
      "Bring Your Own Phone",
      "International Calling",
      "International Roaming",
      "Wi-Fi Calling",
      "Mobile Hotspot",
      "eSIM",
    ],
  },
  {
    title: "About BudgetWise",
    links: [
      "Who We Are",
      "Is BudgetWise Good",
      "Careers",
      "Reviews",
      "Ryan Reynolds",
      "Press",
      "Refer A Friend",
      "Become A Partner",
      "BudgetWise vs. Big Wireless",
    ],
  },
  {
    title: "Support",
    links: ["The Help Center", "Order Status", "Returns & Exchanges", "Unlock Policy"],
  },
];

const BRAND_OPTIONS = ["Apple", "Samsung", "Google", "Motorola", "OnePlus", "Nothing"];

const MODEL_OPTIONS = {
  Apple: [
    "iPhone 16 Pro Max",
    "iPhone 16 Pro",
    "iPhone 16 Plus",
    "iPhone 16",
    "iPhone 15 Pro Max",
    "iPhone 15 Pro",
    "iPhone 15 Plus",
    "iPhone 15",
    "iPhone 14 Pro Max",
    "iPhone 14 Pro",
    "iPhone 14 Plus",
    "iPhone 14",
    "iPhone 13 Pro Max",
    "iPhone 13 Pro",
    "iPhone 13",
    "iPhone 13 Mini",
    "iPhone 12 Pro Max",
    "iPhone 12 Pro",
    "iPhone 12",
    "iPhone 12 Mini",
    "iPhone SE (3rd generation)",
    "iPhone SE (2nd generation)",
    "iPhone 11 Pro Max",
    "iPhone 11 Pro",
    "iPhone 11",
    "iPhone XS Max",
    "iPhone XS",
    "iPhone XR",
    "iPhone X",
  ],
  Samsung: [
    "Galaxy S24 Ultra",
    "Galaxy S24+",
    "Galaxy S24",
    "Galaxy S23 Ultra",
    "Galaxy S23+",
    "Galaxy S23",
    "Galaxy S23 FE",
    "Galaxy S22 Ultra",
    "Galaxy S22+",
    "Galaxy S22",
    "Galaxy S21 Ultra",
    "Galaxy S21+",
    "Galaxy S21",
    "Galaxy S21 FE",
    "Galaxy Z Fold6",
    "Galaxy Z Fold5",
    "Galaxy Z Fold4",
    "Galaxy Z Flip6",
    "Galaxy Z Flip5",
    "Galaxy Z Flip4",
    "Galaxy A54 5G",
    "Galaxy A53 5G",
    "Galaxy A34 5G",
    "Galaxy A25 5G",
    "Galaxy A15 5G",
    "Galaxy A14 5G",
    "Galaxy Note 20 Ultra",
    "Galaxy Note 20",
  ],
  Google: [
    "Pixel 9 Pro XL",
    "Pixel 9 Pro",
    "Pixel 9",
    "Pixel 8 Pro",
    "Pixel 8",
    "Pixel 8a",
    "Pixel 7 Pro",
    "Pixel 7",
    "Pixel 7a",
    "Pixel 6 Pro",
    "Pixel 6",
    "Pixel 6a",
    "Pixel Fold",
    "Pixel 5",
    "Pixel 5a",
    "Pixel 4 XL",
    "Pixel 4",
    "Pixel 4a 5G",
    "Pixel 4a",
  ],
  Motorola: [
    "Razr+ (2024)",
    "Razr (2024)",
    "Razr+ (2023)",
    "Razr (2023)",
    "Edge+ (2023)",
    "Edge (2023)",
    "Edge+ (2022)",
    "Moto G Stylus 5G (2024)",
    "Moto G Stylus 5G (2023)",
    "Moto G Power 5G (2024)",
    "Moto G Power 5G (2023)",
    "Moto G 5G (2024)",
    "Moto G 5G (2023)",
    "Moto G Play (2024)",
    "Moto G Play (2023)",
    "ThinkPhone",
  ],
  OnePlus: [
    "OnePlus 12",
    "OnePlus 12R",
    "OnePlus 11",
    "OnePlus 10 Pro",
    "OnePlus 10T",
    "OnePlus Nord N30 5G",
    "OnePlus Nord N300 5G",
    "OnePlus Nord N20 5G",
    "OnePlus Open",
  ],
  Nothing: [
    "Phone (2a)",
    "Phone (2)",
    "Phone (1)",
  ],
};

const DEFAULT_DEVICE = { brand: "Apple", model: "iPhone SE (3rd generation)" };
const VIEW_OPTIONS = ["home", "plan", "family", "cart"];
const FACTS_TERMS = PLAN_TERMS;
const DEFAULT_BUDGETWISE_STATE = {
  view: "home",
  selectedPlan: "unlimited",
  selectedTerm: "3",
  selectedSim: "esim",
  factsTerm: "3",
  selectedBrand: "",
  selectedModel: "",
  cartItems: [],
  faqOpenId: "",
  family: {
    lines: 1,
    planType: "", // premium, plus, essentials - empty means no plan selected
    simTypes: ["esim"], // Array of SIM types for each line
    brands: [""], // Array of brands for each line
    models: [""], // Array of models for each line
    includesOpen: false,
    message: "",
    discountType: "", // "", "first_responder", "military"
    discountModalOpen: false,
  },
  coverage: {
    zip: "",
    message: "",
    deviceMessage: "",
  },
  promo: {
    open: false,
    code: "",
    discount: 0,
    applied: false,
    adOpen: true,
    message: "",
  },
  newsletter: {
    email: "",
    subscribedAt: "",
    message: "",
  },
};

const formatMoney = (value, withDecimals = false) => {
  if (Number.isNaN(value)) return "$0";
  if (withDecimals) {
    return `$${value.toFixed(2)}`;
  }
  return `$${Math.round(value)}`;
};

const formatTermLabel = (term) => `${term}-Month`;
const formatTermShort = (term) => `${term} Month`;
const formatTermPlural = (term) => `${term} Months`;

const isPlanId = (id) => PLAN_IDS.includes(id);

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeFamilySelections = (rawSelections, lines) => {
  const selections = Array.isArray(rawSelections) ? rawSelections : [];
  const next = [];
  for (let i = 0; i < lines; i += 1) {
    const candidate = selections[i];
    if (isPlanId(candidate)) {
      next.push(candidate);
      continue;
    }
    if (i < FAMILY_MIN_LINES) {
      next.push("unlimited");
      continue;
    }
    next.push("");
  }
  return next;
};

const getPlanDetails = (term, planId) =>
  PLAN_CATALOG[term]?.[planId] || PLAN_CATALOG["3"]?.[planId] || PLAN_CATALOG["3"].unlimited;

const getPlanDisplayLabel = (planId, planDetails) => {
  if (planDetails?.label && planDetails.label.toLowerCase().includes("unltd")) {
    return "Unlimited";
  }
  return PLAN_LABELS[planId] || planDetails?.label || "Unlimited";
};

const getPromoLabel = (term, planId) =>
  planId === "unlimited" ? PROMO_LABELS[term] || "50% OFF" : "";

const formatFeeValue = (value) => {
  if (!value) return "None";
  const trimmed = String(value).trim();
  if (!trimmed) return "None";
  if (trimmed.startsWith("$") || trimmed.toLowerCase().startsWith("up to")) {
    return trimmed;
  }
  if (/^\\d/.test(trimmed)) {
    return `$${trimmed}`;
  }
  return trimmed;
};

const formatRange = (range = [], units = "") => {
  if (!Array.isArray(range) || range.length < 2) return "n/a";
  return `${range[0]}-${range[1]} ${units}`.trim();
};

const normalizeCartItem = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const isFamilyItem = raw.itemType === "family" || Array.isArray(raw.bundleLines) || raw.lines > 0;
  if (isFamilyItem) {
    const term = PLAN_TERMS.includes(String(raw.term))
      ? String(raw.term)
      : DEFAULT_BUDGETWISE_STATE.family.term;
    const quantity = Math.max(1, Number(raw.quantity) || 1);
    const simType =
      raw.simType === "psim" ? "psim" : raw.simType === "esim" ? "esim" : "psim";
    const device =
      simType === "psim"
        ? null
        : raw.device && typeof raw.device === "object"
          ? {
              brand: raw.device.brand || DEFAULT_DEVICE.brand,
              model: raw.device.model || DEFAULT_DEVICE.model,
            }
          : { ...DEFAULT_DEVICE };
    // Support new T-Mobile style pricing
    const lines = Number(raw.lines) || (Array.isArray(raw.bundleLines) ? raw.bundleLines.length : 2);
    const pricing = getFamilyPricing(term, lines);
    return {
      id: raw.id || "family-item",
      itemType: "family",
      planId: "unlimited",
      term,
      simType,
      quantity,
      device,
      lines,
      pricePerLine: raw.pricePerLine || pricing.pricePerLine,
      monthlyTotal: raw.monthlyTotal || pricing.monthlyTotal,
      upfrontTotal: raw.upfrontTotal || pricing.upfrontTotal,
      bundleId: typeof raw.bundleId === "string" ? raw.bundleId : "",
      addedAt: raw.addedAt || "",
    };
  }
  const planId = isPlanId(raw.planId)
    ? raw.planId
    : isPlanId(raw.plan?.id)
      ? raw.plan.id
      : DEFAULT_BUDGETWISE_STATE.selectedPlan;
  const term = PLAN_TERMS.includes(String(raw.term))
    ? String(raw.term)
    : DEFAULT_BUDGETWISE_STATE.selectedTerm;
  const quantity = Math.max(1, Number(raw.quantity) || 1);
  const simType = raw.simType === "psim" ? "psim" : DEFAULT_BUDGETWISE_STATE.selectedSim;
  const device =
    simType === "psim"
      ? null
      : raw.device && typeof raw.device === "object"
        ? {
            brand: raw.device.brand || DEFAULT_DEVICE.brand,
            model: raw.device.model || DEFAULT_DEVICE.model,
          }
        : { ...DEFAULT_DEVICE };
  const discountPercent = clampValue(Number(raw.discountPercent) || 0, 0, 100);
  const bundleId = typeof raw.bundleId === "string" ? raw.bundleId : "";
  return {
    id: raw.id || "cart-item",
    itemType: "plan",
    planId,
    term,
    simType,
    quantity,
    device,
    discountPercent,
    bundleId,
    bundleLines: [],
    addedAt: raw.addedAt || "",
  };
};

const normalizeCartItems = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeCartItem).filter(Boolean);
};

const normalizeBudgetwiseState = (raw = {}) => {
  const safe = raw && typeof raw === "object" ? raw : {};
  const view = VIEW_OPTIONS.includes(safe.view) ? safe.view : DEFAULT_BUDGETWISE_STATE.view;
  const selectedPlan = isPlanId(safe.selectedPlan)
    ? safe.selectedPlan
    : DEFAULT_BUDGETWISE_STATE.selectedPlan;
  const selectedTerm = PLAN_TERMS.includes(String(safe.selectedTerm))
    ? String(safe.selectedTerm)
    : DEFAULT_BUDGETWISE_STATE.selectedTerm;
  const selectedSim = safe.selectedSim === "psim" ? "psim" : DEFAULT_BUDGETWISE_STATE.selectedSim;
  const factsTerm = FACTS_TERMS.includes(String(safe.factsTerm))
    ? String(safe.factsTerm)
    : DEFAULT_BUDGETWISE_STATE.factsTerm;
  const selectedBrand = BRAND_OPTIONS.includes(safe.selectedBrand) ? safe.selectedBrand : "";
  const selectedModel = typeof safe.selectedModel === "string" ? safe.selectedModel : "";
  const cartItems =
    Array.isArray(safe.cartItems) && safe.cartItems.length
      ? normalizeCartItems(safe.cartItems)
      : safe.cartItem
        ? normalizeCartItems([safe.cartItem])
        : [];
  const faqOpenId = typeof safe.faqOpenId === "string" ? safe.faqOpenId : "";
  const family = {
    ...DEFAULT_BUDGETWISE_STATE.family,
    ...(safe.family && typeof safe.family === "object" ? safe.family : {}),
  };
  family.lines = clampValue(
    Number(family.lines) || DEFAULT_BUDGETWISE_STATE.family.lines,
    FAMILY_MIN_LINES,
    FAMILY_MAX_LINES
  );
  family.term = PLAN_TERMS.includes(String(family.term))
    ? String(family.term)
    : DEFAULT_BUDGETWISE_STATE.family.term;
  // Validate planType - only allow valid plan types or empty string
  family.planType = FAMILY_PLAN_TYPES[family.planType] ? family.planType : "";
  family.selections = normalizeFamilySelections(family.selections, family.lines);
  family.simType = family.simType === "psim" ? "psim" : DEFAULT_BUDGETWISE_STATE.family.simType;
  family.brand = BRAND_OPTIONS.includes(family.brand) ? family.brand : "";
  family.model = typeof family.model === "string" ? family.model : "";
  if (!family.brand) {
    family.model = "";
  }
  if (family.simType === "psim") {
    family.brand = "";
    family.model = "";
  }
  family.modalOpen = Boolean(family.modalOpen);
  family.editingIndex = Number.isInteger(family.editingIndex) ? family.editingIndex : -1;
  if (family.editingIndex < 0 || family.editingIndex >= family.lines) {
    family.editingIndex = -1;
  }
  family.modalSelection = isPlanId(family.modalSelection)
    ? family.modalSelection
    : family.editingIndex >= 0
      ? family.selections[family.editingIndex] || DEFAULT_BUDGETWISE_STATE.family.modalSelection
      : DEFAULT_BUDGETWISE_STATE.family.modalSelection;
  if (family.modalOpen && family.editingIndex === -1) {
    family.modalOpen = false;
  }
  family.includesOpen = Boolean(family.includesOpen);
  family.message = typeof family.message === "string" ? family.message : "";
  const coverage = {
    ...DEFAULT_BUDGETWISE_STATE.coverage,
    ...(safe.coverage && typeof safe.coverage === "object" ? safe.coverage : {}),
  };
  coverage.zip = typeof coverage.zip === "string" ? coverage.zip : "";
  coverage.message = typeof coverage.message === "string" ? coverage.message : "";
  coverage.deviceMessage =
    typeof coverage.deviceMessage === "string" ? coverage.deviceMessage : "";
  const promo = {
    ...DEFAULT_BUDGETWISE_STATE.promo,
    ...(safe.promo && typeof safe.promo === "object" ? safe.promo : {}),
  };
  promo.open = Boolean(promo.open);
  promo.code = typeof promo.code === "string" ? promo.code.trim().toUpperCase() : "";
  promo.adOpen =
    typeof promo.adOpen === "boolean" ? promo.adOpen : DEFAULT_BUDGETWISE_STATE.promo.adOpen;
  promo.applied = Boolean(promo.applied) && promo.code === PROMO_CODE;
  promo.discount = promo.applied ? PROMO_DISCOUNT_PERCENT : 0;
  promo.message = typeof promo.message === "string" ? promo.message : "";
  if (view === "home") {
    promo.adOpen = true;
  }
  const newsletter = {
    ...DEFAULT_BUDGETWISE_STATE.newsletter,
    ...(safe.newsletter && typeof safe.newsletter === "object" ? safe.newsletter : {}),
  };
  newsletter.email = typeof newsletter.email === "string" ? newsletter.email : "";
  newsletter.subscribedAt =
    typeof newsletter.subscribedAt === "string" ? newsletter.subscribedAt : "";
  newsletter.message = typeof newsletter.message === "string" ? newsletter.message : "";
  return {
    ...DEFAULT_BUDGETWISE_STATE,
    view,
    selectedPlan,
    selectedTerm,
    selectedSim,
    factsTerm,
    selectedBrand,
    selectedModel,
    cartItems,
    faqOpenId,
    family,
    coverage,
    promo,
    newsletter,
  };
};

const formatDeviceLabel = (device) => {
  if (!device) return `${DEFAULT_DEVICE.brand} ${DEFAULT_DEVICE.model}`;
  if (device.brand && device.model) return `${device.brand} ${device.model}`;
  return device.brand || device.model || `${DEFAULT_DEVICE.brand} ${DEFAULT_DEVICE.model}`;
};

const SimCardGraphic = ({ className = "" }) => (
  <div className={`sim-card-graphic ${className}`} aria-hidden="true">
    <div className="sim-card-body">
      <div className="sim-card-logo">BudgetWise</div>
      <div className="sim-card-chip">
        <span />
        <span />
      </div>
      <div className="sim-card-fox">
        <span className="fox-ear fox-ear-left" />
        <span className="fox-ear fox-ear-right" />
        <span className="fox-face" />
        <div className="fox-glasses">
          <span className="fox-lens" />
          <span className="fox-bridge" />
          <span className="fox-lens" />
        </div>
      </div>
    </div>
  </div>
);

const CartIcon = ({ hasItems }) => (
  <div className="cart-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="img">
      <path
        d="M7 6h12l-1.2 8.4a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.7L5.6 4H3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19" r="1.4" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.4" fill="currentColor" />
    </svg>
    {hasItems && <span className="cart-badge" />}
  </div>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" role="img">
    <circle cx="10" cy="10" r="9" fill="#5f806c" />
    <path
      d="M6.2 10.2l2.4 2.5 5.4-5.5"
      fill="none"
      stroke="#fff"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" role="img">
    <path
      d="M5 7.5h14v8.2a2 2 0 0 1-2 2H9l-4 3v-3H7a2 2 0 0 1-2-2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LeafIcon = () => (
  <svg viewBox="0 0 24 24" role="img">
    <path
      d="M6 15c4.5-5 10.8-6.8 12.6-6.5-0.2 1.6-1.6 7-6.6 9.6-2.8 1.4-5.6 1.2-7.2 0.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9.5 12.8l4.6 4.7" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

// Warning/Info icon for limited features - matches the leaf icon style
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" role="img">
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16" r="0.8" fill="currentColor" />
  </svg>
);

function App() {
  const [view, setView] = useState("home");
  const [selectedPlan, setSelectedPlan] = useState("unlimited");
  const [selectedTerm, setSelectedTerm] = useState("3");
  const [selectedSim, setSelectedSim] = useState("esim");
  const [factsTerm, setFactsTerm] = useState("3");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [faqOpenId, setFaqOpenId] = useState("");
  const [familyLines, setFamilyLines] = useState(DEFAULT_BUDGETWISE_STATE.family.lines);
  const [familyPlanType, setFamilyPlanType] = useState(DEFAULT_BUDGETWISE_STATE.family.planType);
  const [familySim, setFamilySim] = useState(DEFAULT_BUDGETWISE_STATE.family.simTypes);
  const [familyBrand, setFamilyBrand] = useState(DEFAULT_BUDGETWISE_STATE.family.brands);
  const [familyModel, setFamilyModel] = useState(DEFAULT_BUDGETWISE_STATE.family.models);
  const [familyIncludesOpen, setFamilyIncludesOpen] = useState(
    DEFAULT_BUDGETWISE_STATE.family.includesOpen
  );
  const [familyMessage, setFamilyMessage] = useState("");
  const [familyDiscountType, setFamilyDiscountType] = useState(
    DEFAULT_BUDGETWISE_STATE.family.discountType
  );
  const [familyDiscountModalOpen, setFamilyDiscountModalOpen] = useState(
    DEFAULT_BUDGETWISE_STATE.family.discountModalOpen
  );
  const [coverageZip, setCoverageZip] = useState("");
  const [coverageMessage, setCoverageMessage] = useState("");
  const [deviceCheckMessage, setDeviceCheckMessage] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoAdOpen, setPromoAdOpen] = useState(true);
  const [promoMessage, setPromoMessage] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribedAt, setNewsletterSubscribedAt] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [backendReady, setBackendReady] = useState(false);
  const [toast, setToast] = useState("");
  const [plansDropdownOpen, setPlansDropdownOpen] = useState(false);

  // Checkout state
  const [checkoutBilling, setCheckoutBilling] = useState({
    firstName: "",
    lastName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
  });
  const [checkoutShipping, setCheckoutShipping] = useState({
    firstName: "",
    lastName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
  });
  const [checkoutUseBillingAsShipping, setCheckoutUseBillingAsShipping] = useState(false);
  const [checkoutAutoRenewal, setCheckoutAutoRenewal] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState("credit");
  const [checkoutCard, setCheckoutCard] = useState({
    number: "",
    expMonth: "",
    expYear: "",
    cvv: "",
  });

  const isHydrating = useRef(true);
  const lastSyncedRef = useRef("");
  const syncTimerRef = useRef(null);

  const applyBudgetwiseState = (budgetwiseState) => {
    setView(budgetwiseState.view);
    setSelectedPlan(budgetwiseState.selectedPlan);
    setSelectedTerm(budgetwiseState.selectedTerm);
    setSelectedSim(budgetwiseState.selectedSim);
    setFactsTerm(budgetwiseState.factsTerm);
    setSelectedBrand(budgetwiseState.selectedBrand);
    setSelectedModel(budgetwiseState.selectedModel);
    setCartItems(budgetwiseState.cartItems);
    setFaqOpenId(budgetwiseState.faqOpenId);
    setFamilyLines(budgetwiseState.family.lines);
    setFamilyPlanType(budgetwiseState.family.planType);
    setFamilySim(budgetwiseState.family.simTypes || ["esim"]);
    setFamilyBrand(budgetwiseState.family.brands || [""]);
    setFamilyModel(budgetwiseState.family.models || [""]);
    setFamilyIncludesOpen(budgetwiseState.family.includesOpen);
    setFamilyMessage(budgetwiseState.family.message);
    setFamilyDiscountType(budgetwiseState.family.discountType || "");
    setFamilyDiscountModalOpen(budgetwiseState.family.discountModalOpen || false);
    setCoverageZip(budgetwiseState.coverage.zip);
    setCoverageMessage(budgetwiseState.coverage.message);
    setDeviceCheckMessage(budgetwiseState.coverage.deviceMessage);
    setPromoOpen(budgetwiseState.promo.open);
    setPromoCode(budgetwiseState.promo.code);
    setPromoDiscount(budgetwiseState.promo.discount);
    setPromoApplied(budgetwiseState.promo.applied);
    setPromoAdOpen(budgetwiseState.promo.adOpen);
    setPromoMessage(budgetwiseState.promo.message);
    setNewsletterEmail(budgetwiseState.newsletter.email);
    setNewsletterSubscribedAt(budgetwiseState.newsletter.subscribedAt);
    setNewsletterMessage(budgetwiseState.newsletter.message);
  };

  const notify = (message) => {
    setToast(message);
  };

  const buildBudgetwiseState = () => ({
    view,
    selectedPlan,
    selectedTerm,
    selectedSim,
    factsTerm,
    selectedBrand,
    selectedModel,
    cartItems,
    faqOpenId,
    family: {
      lines: familyLines,
      planType: familyPlanType,
      simTypes: familySim,
      brands: familyBrand,
      models: familyModel,
      includesOpen: familyIncludesOpen,
      message: familyMessage,
      discountType: familyDiscountType,
      discountModalOpen: familyDiscountModalOpen,
    },
    coverage: {
      zip: coverageZip,
      message: coverageMessage,
      deviceMessage: deviceCheckMessage,
    },
    promo: {
      open: promoOpen,
      code: promoCode,
      discount: promoDiscount,
      applied: promoApplied,
      adOpen: promoAdOpen,
      message: promoMessage,
    },
    newsletter: {
      email: newsletterEmail,
      subscribedAt: newsletterSubscribedAt,
      message: newsletterMessage,
    },
  });

  const navigateTo = (nextView) => {
    setView(nextView);
    // Push state to browser history for back button support
    window.history.pushState({ view: nextView }, "", `#${nextView}`);
  };

  useEffect(() => {
    document.body.classList.add("budgetwise-body");
    return () => document.body.classList.remove("budgetwise-body");
  }, []);

  // Handle browser back/forward button
  useEffect(() => {
    // Set initial state in history
    const initialView = window.location.hash.replace("#", "") || "home";
    const validViews = ["home", "family", "family-confirm", "plan", "cart", "checkout"];
    if (validViews.includes(initialView)) {
      setView(initialView);
    }
    window.history.replaceState({ view: initialView }, "", `#${initialView}`);

    const handlePopState = (event) => {
      if (event.state?.view) {
        setView(event.state.view);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Fallback: try to get view from hash
        const hashView = window.location.hash.replace("#", "") || "home";
        if (validViews.includes(hashView)) {
          setView(hashView);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    // Check for cookie override from query parameter first
    const redirected = applyCookieFromQuery();
    if (redirected) return; // Page will reload with clean URL

    let isMounted = true;
    const loadState = async () => {
      try {
        const response = await api.getState();
        if (!isMounted) return;
        const nextBudgetwise = normalizeBudgetwiseState(response?.state?.data?.budgetwise);
        applyBudgetwiseState(nextBudgetwise);
        setBackendReady(true);
        if (response?.state?.data?.budgetwise) {
          lastSyncedRef.current = JSON.stringify(nextBudgetwise);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        notify("Backend sync failed. Changes are local only.");
      } finally {
        if (isMounted) {
          isHydrating.current = false;
        }
      }
    };
    loadState();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const planTitle = `BudgetWise - ${formatTermLabel(selectedTerm)} Plans`;
    const titles = {
      home: "BudgetWise - Phone Plans",
      plan: planTitle,
      family: "BudgetWise - Family Plans",
      cart: "BudgetWise - Shopping Cart",
    };
    document.title = titles[view] || "BudgetWise";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view, selectedTerm]);

  useEffect(() => {
    if (view === "home" || view === "family") {
      setPromoAdOpen(true);
    }
  }, [view]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!backendReady || isHydrating.current) return;
    const nextState = buildBudgetwiseState();
    const serialized = JSON.stringify(nextState);
    if (serialized === lastSyncedRef.current) return;
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      api
        .patchState({ budgetwise: nextState })
        .then(() => {
          lastSyncedRef.current = serialized;
        })
        .catch((err) => {
          console.error(err);
        });
    }, 200);
    return () => clearTimeout(syncTimerRef.current);
  }, [
    backendReady,
    view,
    selectedPlan,
    selectedTerm,
    selectedSim,
    factsTerm,
    selectedBrand,
    selectedModel,
    cartItems,
    faqOpenId,
    familyLines,
    familyPlanType,
    familySim,
    familyBrand,
    familyModel,
    familyIncludesOpen,
    familyMessage,
    coverageZip,
    coverageMessage,
    deviceCheckMessage,
    promoOpen,
    promoCode,
    promoDiscount,
    promoApplied,
    promoAdOpen,
    promoMessage,
    newsletterEmail,
    newsletterSubscribedAt,
    newsletterMessage,
  ]);

  const activePlan = useMemo(
    () => getPlanDetails(selectedTerm, selectedPlan),
    [selectedTerm, selectedPlan]
  );

  const modelOptions = selectedBrand ? MODEL_OPTIONS[selectedBrand] || [] : [];
  const familyModelOptions = familyBrand ? MODEL_OPTIONS[familyBrand] || [] : [];
  const currentDevice = useMemo(() => {
    const brand = selectedBrand || DEFAULT_DEVICE.brand;
    const fallbackModel = selectedBrand
      ? MODEL_OPTIONS[selectedBrand]?.[0] || DEFAULT_DEVICE.model
      : DEFAULT_DEVICE.model;
    const model = selectedModel || fallbackModel;
    return { brand, model };
  }, [selectedBrand, selectedModel]);
  const familyDevice = useMemo(() => {
    const brand = familyBrand || DEFAULT_DEVICE.brand;
    const fallbackModel = familyBrand
      ? MODEL_OPTIONS[familyBrand]?.[0] || DEFAULT_DEVICE.model
      : DEFAULT_DEVICE.model;
    const model = familyModel || fallbackModel;
    return { brand, model };
  }, [familyBrand, familyModel]);
  const activePlanLabel = getPlanDisplayLabel(selectedPlan, activePlan);
  const activeTermNumber = Number(selectedTerm);
  const activePlanRegularTotal = activePlan.strike
    ? activePlan.strike * activeTermNumber
    : 0;
  const renewalOptions = useMemo(
    () =>
      PLAN_TERMS.map((term) => {
        const details = getPlanDetails(term, selectedPlan);
        const price = details.renewalMonthly || details.monthly;
        return {
          id: term,
          title: `${formatTermLabel(term)} Renewal`,
          price,
          total: price * Number(term),
          badge: term === "12" ? "Best Value" : "",
          active: term === selectedTerm,
        };
      }),
    [selectedPlan, selectedTerm]
  );

  // T-Mobile style family pricing: more lines = lower price per line
  const familyPricing = useMemo(
    () => getFamilyPricing(familyPlanType, familyLines, familyDiscountType),
    [familyPlanType, familyLines, familyDiscountType]
  );
  const familyMonthlyTotal = familyPricing.monthly;
  const familyDueToday = familyPricing.monthly; // Monthly billing like T-Mobile
  const familyReady = familyLines >= FAMILY_MIN_LINES && !!familyPlanType && !!FAMILY_PLAN_TYPES[familyPlanType];
  const currentPlanInfo = familyPlanType ? FAMILY_PLAN_TYPES[familyPlanType] : null;

  const handleAddToCart = () => {
    const device = selectedSim === "psim" ? null : currentDevice;
    const nextCart = {
      id: `cart-${Date.now()}`,
      itemType: "plan",
      planId: selectedPlan,
      term: selectedTerm,
      simType: selectedSim,
      quantity: 1,
      device,
      discountPercent: 0,
      bundleId: "",
      bundleLines: [],
      addedAt: new Date().toISOString(),
    };
    setCartItems((prev) => [...prev, nextCart]);
    navigateTo("cart");
    const planLabel = getPlanDisplayLabel(selectedPlan, activePlan);
    setToast(`${formatTermShort(selectedTerm)}, ${planLabel} - SIM Kit has been added to your cart.`);
  };

  const handleShopPlans = (term) => {
    setSelectedTerm(term);
    setFactsTerm(term);
    setSelectedPlan("unlimited");
    setSelectedSim("esim");
    setSelectedBrand("");
    setSelectedModel("");
    navigateTo("plan");
  };

  const handleSimToggle = (nextSim) => {
    setSelectedSim(nextSim);
    if (nextSim === "psim") {
      setSelectedBrand("");
      setSelectedModel("");
      setDeviceCheckMessage("");
    }
  };

  const handleFamilySimToggle = (nextSim) => {
    // Set all lines to the same SIM type (for backward compatibility)
    setFamilySim(Array(familyLines).fill(nextSim));
    if (nextSim === "psim") {
      setFamilyBrand(Array(familyLines).fill(""));
      setFamilyModel(Array(familyLines).fill(""));
    }
    if (familyMessage) {
      setFamilyMessage("");
    }
  };

  // Handle SIM type change for a specific line
  const handleLineSimChange = (lineIndex, simType) => {
    setFamilySim((prev) => {
      const newSimTypes = [...prev];
      newSimTypes[lineIndex] = simType;
      return newSimTypes;
    });
    if (simType === "psim") {
      setFamilyBrand((prev) => {
        const newBrands = [...prev];
        newBrands[lineIndex] = "";
        return newBrands;
      });
      setFamilyModel((prev) => {
        const newModels = [...prev];
        newModels[lineIndex] = "";
        return newModels;
      });
    }
  };

  // Handle brand change for a specific line
  const handleLineBrandChange = (lineIndex, brand) => {
    setFamilyBrand((prev) => {
      const newBrands = [...prev];
      newBrands[lineIndex] = brand;
      return newBrands;
    });
    setFamilyModel((prev) => {
      const newModels = [...prev];
      newModels[lineIndex] = "";
      return newModels;
    });
  };

  // Handle model change for a specific line
  const handleLineModelChange = (lineIndex, model) => {
    setFamilyModel((prev) => {
      const newModels = [...prev];
      newModels[lineIndex] = model;
      return newModels;
    });
  };

  // Sync SIM types, brands, and models arrays when familyLines changes
  useEffect(() => {
    setFamilySim((prev) => {
      if (prev.length === familyLines) return prev;
      if (prev.length < familyLines) {
        // Add new entries with default "esim"
        return [...prev, ...Array(familyLines - prev.length).fill("esim")];
      }
      // Trim excess entries
      return prev.slice(0, familyLines);
    });
    setFamilyBrand((prev) => {
      if (prev.length === familyLines) return prev;
      if (prev.length < familyLines) {
        return [...prev, ...Array(familyLines - prev.length).fill("")];
      }
      return prev.slice(0, familyLines);
    });
    setFamilyModel((prev) => {
      if (prev.length === familyLines) return prev;
      if (prev.length < familyLines) {
        return [...prev, ...Array(familyLines - prev.length).fill("")];
      }
      return prev.slice(0, familyLines);
    });
  }, [familyLines]);

  const handleCartClick = () => {
    if (!cartItems.length) {
      notify("Your cart is empty.");
    }
    navigateTo("cart");
  };

  const handleQuantityChange = (itemId, delta) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.itemType === "family") return item;
        const nextQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQty };
      })
    );
  };

  const handleCartSimToggle = (itemId, nextSim) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.itemType === "family") return item;
        return {
          ...item,
          simType: nextSim,
          device: nextSim === "psim" ? null : item.device || currentDevice,
        };
      })
    );
  };

  const handleBrandChange = (event) => {
    const nextBrand = event.target.value;
    setSelectedBrand(nextBrand);
    setSelectedModel("");
    if (deviceCheckMessage) {
      setDeviceCheckMessage("");
    }
  };

  const handleModelChange = (event) => {
    const nextModel = event.target.value;
    setSelectedModel(nextModel);
    if (deviceCheckMessage) {
      setDeviceCheckMessage("");
    }
  };

  const handleFamilyBrandChange = (event) => {
    const nextBrand = event.target.value;
    setFamilyBrand(nextBrand);
    setFamilyModel("");
    if (familyMessage) {
      setFamilyMessage("");
    }
  };

  const handleFamilyModelChange = (event) => {
    const nextModel = event.target.value;
    setFamilyModel(nextModel);
    if (familyMessage) {
      setFamilyMessage("");
    }
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleTermSelect = (term) => {
    if (!PLAN_TERMS.includes(term)) return;
    setSelectedTerm(term);
    setFactsTerm(term);
  };

  const handleFactsSelect = (term) => {
    setFactsTerm(term);
  };

  const handleFaqToggle = (id) => {
    setFaqOpenId((prev) => (prev === id ? "" : id));
  };

  const handleFamilyLines = (delta) => {
    setFamilyLines((prev) => {
      const next = clampValue(prev + delta, FAMILY_MIN_LINES, FAMILY_MAX_LINES);
      return next;
    });
    if (familyMessage) {
      setFamilyMessage("");
    }
  };

  const handleFamilyStart = () => {
    if (view !== "family") {
      navigateTo("family");
      return;
    }
    const target = document.getElementById("family-builder");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFamilyAddLine = () => {
    handleFamilyLines(1);
  };

  const handleFamilyPlanTypeSelect = (planType) => {
    if (!FAMILY_PLAN_TYPES[planType]) return;
    setFamilyPlanType(planType);
    if (familyMessage) {
      setFamilyMessage("");
    }
  };

  const handleFamilyRemoveLine = () => {
    if (familyLines <= FAMILY_MIN_LINES) return;
    setFamilyLines((prev) => {
      const next = clampValue(prev - 1, FAMILY_MIN_LINES, FAMILY_MAX_LINES);
      return next;
    });
    if (familyMessage) {
      setFamilyMessage("");
    }
  };

  // Navigate to family plan confirmation page
  const handleFamilyContinue = () => {
    if (familyLines < FAMILY_MIN_LINES) {
      setFamilyMessage("Select at least one line before continuing.");
      return;
    }
    if (!familyPlanType || !FAMILY_PLAN_TYPES[familyPlanType]) {
      setFamilyMessage("Please select a plan before continuing.");
      return;
    }
    setView("family-confirm");
    window.history.pushState({ view: "family-confirm" }, "", "#family-confirm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFamilyAddToCart = () => {
    if (familyLines < FAMILY_MIN_LINES) {
      setFamilyMessage("Select at least one line before adding to cart.");
      return;
    }
    if (!familyPlanType || !FAMILY_PLAN_TYPES[familyPlanType]) {
      setFamilyMessage("Please select a plan before adding to cart.");
      return;
    }
    const timestamp = new Date();
    const bundleId = `family-${timestamp.getTime()}`;
    const addedAt = timestamp.toISOString();
    const pricing = getFamilyPricing(familyPlanType, familyLines, familyDiscountType);
    const planInfo = FAMILY_PLAN_TYPES[familyPlanType];
    // Default to 1 month (monthly billing)
    const upfrontTotal = pricing.monthly * 1;
    // Build line details array
    const lineDetails = [];
    for (let i = 0; i < familyLines; i++) {
      lineDetails.push({
        lineNumber: i + 1,
        simType: familySim[i] || "esim",
        brand: familyBrand[i] || "",
        model: familyModel[i] || "",
      });
    }
    const nextItem = {
      id: `cart-${bundleId}`,
      itemType: "family",
      planId: familyPlanType,
      planName: planInfo.name,
      term: "1", // Default to monthly billing
      simTypes: familySim, // Array of SIM types
      lineDetails: lineDetails, // Detailed info for each line
      quantity: 1,
      lines: familyLines,
      pricePerLine: pricing.perLine,
      monthlyTotal: pricing.monthly,
      originalTotal: pricing.original,
      upfrontTotal: upfrontTotal,
      bundleId,
      addedAt,
    };
    setCartItems((prev) => [...prev, nextItem]);
    setView("cart");
    window.history.pushState({ view: "cart" }, "", "#cart");
    setToast(
      `${planInfo.name} added: ${familyLines} line${familyLines > 1 ? "s" : ""} at $${pricing.monthly}/mo.`
    );
  };

  const handleCoverageCheck = () => {
    const trimmed = coverageZip.trim();
    if (!/^[0-9]{5}$/.test(trimmed)) {
      setCoverageMessage("Enter a 5-digit ZIP code.");
      return;
    }
    setCoverageZip(trimmed);
    setCoverageMessage(`Coverage looks strong in ${trimmed}.`);
  };

  const handleDeviceCheck = () => {
    if (!selectedBrand || !selectedModel) {
      setDeviceCheckMessage("Select a brand and model to check compatibility.");
      return;
    }
    setDeviceCheckMessage(
      `${selectedBrand} ${selectedModel} is compatible. You can activate with eSIM if supported.`
    );
  };

  const handleCompareSim = () => {
    setFaqOpenId("esim");
    navigateTo("home");
  };

  const handlePromoToggle = () => {
    const nextOpen = !promoOpen;
    setPromoOpen(nextOpen);
  };

  const handlePromoAdClose = () => {
    setPromoAdOpen(false);
  };

  const handlePromoAdCopy = async () => {
    let copied = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(PROMO_CODE);
        copied = true;
      } catch (err) {
        copied = false;
      }
    }
    if (!copied) {
      const textarea = document.createElement("textarea");
      textarea.value = PROMO_CODE;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        copied = document.execCommand("copy");
      } catch (err) {
        copied = false;
      }
      document.body.removeChild(textarea);
    }
    setPromoAdOpen(false);
    setToast(
      copied
        ? `Code ${PROMO_CODE} copied to clipboard.`
        : `Copy failed. Code: ${PROMO_CODE}`
    );
  };

  const handlePromoApply = () => {
    if (!cartItems.length) {
      setPromoApplied(false);
      setPromoDiscount(0);
      setPromoMessage("Add a plan before applying a code.");
      return;
    }
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoApplied(false);
      setPromoDiscount(0);
      setPromoMessage("Enter a promo code.");
      return;
    }
    setPromoCode(code);
    if (code === PROMO_CODE) {
      setPromoApplied(true);
      setPromoDiscount(PROMO_DISCOUNT_PERCENT);
      setPromoMessage(`Promo applied: ${PROMO_DISCOUNT_PERCENT}% off.`);
      return;
    }
    setPromoApplied(false);
    setPromoDiscount(0);
    setPromoMessage(
      `Promo code not recognized. Use ${PROMO_CODE} for ${PROMO_DISCOUNT_PERCENT}% off.`
    );
  };

  const handleRemoveItem = (itemId) => {
    setCartItems((prev) => {
      const next = prev.filter((item) => item.id !== itemId);
      if (!next.length) {
        setPromoOpen(false);
        setPromoApplied(false);
        setPromoDiscount(0);
        setPromoCode("");
        setPromoMessage("");
      }
      return next;
    });
    setToast("Item removed from cart.");
  };

  const handleChangePlan = (item) => {
    if (item?.term) {
      setSelectedTerm(item.term);
      setFactsTerm(item.term);
    }
    if (item?.planId) {
      setSelectedPlan(item.planId);
    }
    navigateTo("plan");
  };

  const handleCheckout = () => {
    if (!hasCartItems) {
      notify("Your cart is empty.");
      return;
    }
    setView("checkout");
    window.history.pushState({ view: "checkout" }, "", "#checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Checkout form handlers
  const handleBillingChange = (field, value) => {
    setCheckoutBilling((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingChange = (field, value) => {
    setCheckoutShipping((prev) => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (field, value) => {
    setCheckoutCard((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = () => {
    // Validate required fields
    const requiredBilling = ["firstName", "lastName", "street", "city", "state", "zip", "email"];
    const missingBilling = requiredBilling.filter((f) => !checkoutBilling[f].trim());
    if (missingBilling.length > 0) {
      notify("Please fill in all required billing fields.");
      return;
    }

    if (!checkoutUseBillingAsShipping) {
      const requiredShipping = ["firstName", "lastName", "street", "city", "state", "zip"];
      const missingShipping = requiredShipping.filter((f) => !checkoutShipping[f].trim());
      if (missingShipping.length > 0) {
        notify("Please fill in all required shipping fields.");
        return;
      }
    }

    if (checkoutPaymentMethod === "credit") {
      const requiredCard = ["number", "expMonth", "expYear", "cvv"];
      const missingCard = requiredCard.filter((f) => !checkoutCard[f].trim());
      if (missingCard.length > 0) {
        notify("Please fill in all payment card details.");
        return;
      }
    }

    // Simulate order placement
    notify("Order placed successfully! Thank you for your purchase.");
    setCartItems([]);
    setPromoCode("");
    setPromoDiscount(0);
    setPromoApplied(false);
    setView("home");
    window.history.pushState({ view: "home" }, "", "#home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubscribe = () => {
    const trimmed = newsletterEmail.trim();
    if (!trimmed) {
      setNewsletterMessage("Enter an email address.");
      return;
    }
    setNewsletterEmail(trimmed);
    setNewsletterSubscribedAt(new Date().toISOString());
    setNewsletterMessage("Thanks for subscribing!");
  };

  const handleNavClick = (label) => {
    if (label === "Plans") {
      setPlansDropdownOpen((prev) => !prev);
      return;
    }
    notify(`${label} page is not available in this demo.`);
  };

  const handlePlansDropdownSelect = (option) => {
    setPlansDropdownOpen(false);
    if (option === "shop") {
      navigateTo("home");
    } else if (option === "family") {
      navigateTo("family");
    }
  };

  const hasCartItems = cartItems.length > 0;
  const primaryCartItem = cartItems.find((item) => item.itemType !== "family") || null;
  const getCartItemSubtotal = (item) => {
    if (item.itemType === "family") {
      // New T-Mobile style pricing
      if (item.upfrontTotal) {
        return item.upfrontTotal * item.quantity;
      }
      // Legacy support for old cart items
      const bundleSubtotal = (item.bundleLines || []).reduce((sum, line) => {
        const details = getPlanDetails(item.term, line.planId);
        return sum + details.upfront;
      }, 0);
      return bundleSubtotal * item.quantity;
    }
    const details = getPlanDetails(item.term, item.planId);
    return details.upfront * item.quantity;
  };
  const cartSubtotal = cartItems.reduce((sum, item) => sum + getCartItemSubtotal(item), 0);
  // No longer using percentage-based family discount
  const cartSubtotalAfterFamily = cartSubtotal;
  const cartPromoDiscount =
    promoApplied && hasCartItems
      ? Math.min((cartSubtotalAfterFamily * promoDiscount) / 100, cartSubtotalAfterFamily)
      : 0;
  const cartTotal = hasCartItems
    ? Math.max(cartSubtotalAfterFamily - cartPromoDiscount, 0)
    : 0;
  const simLabel = selectedSim === "esim" ? "eSIM" : "Physical SIM";
  const familySimLabel = familySim === "esim" ? "eSIM" : "Physical SIM";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plansDropdownOpen && !event.target.closest(".nav-dropdown-wrapper")) {
        setPlansDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [plansDropdownOpen]);

  return (
    <div className="budgetwise-app">
      {toast && (
        <div className="toast">
          <span className="toast-icon">
            <CheckIcon />
          </span>
          <span className="toast-text">{toast}</span>
          <button type="button" className="toast-close" onClick={() => setToast("")}>
            x
          </button>
        </div>
      )}

      <div className="announcement-bar">
        Limited time offer: Save 5% on any plan with code {PROMO_CODE}.
      </div>

      <header className="site-header">
        <div className="container header-row">
          <nav className="nav-left">
            <div className="nav-dropdown-wrapper">
              <button
                type="button"
                className={`nav-item nav-item-bold ${plansDropdownOpen ? "is-open" : ""}`}
                onClick={() => handleNavClick("Plans")}
              >
                Plans
                <span className="nav-caret" />
              </button>
              {plansDropdownOpen && (
                <div className="nav-dropdown">
                  <button
                    type="button"
                    className="nav-dropdown-item"
                    onClick={() => handlePlansDropdownSelect("family")}
                  >
                    Pay monthly
          </button>
              <button
                type="button"
                    className="nav-dropdown-item"
                    onClick={() => handlePlansDropdownSelect("shop")}
              >
                    Pay upfront
              </button>
                </div>
              )}
            </div>
          </nav>
          <button type="button" className="budgetwise-logo" onClick={() => navigateTo("home")}>
            <span>Budget</span>
            <span className="budgetwise-logo-light">Wise</span>
          </button>
          <nav className="nav-right">
            <button type="button" className="nav-icon" onClick={handleCartClick}>
              <CartIcon hasItems={hasCartItems} />
            </button>
          </nav>
        </div>
      </header>

      {promoAdOpen && (view === "home" || view === "family") && (
        <div className="promo-modal-overlay" onClick={handlePromoAdClose}>
          <div className="promo-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="promo-modal-close"
              onClick={handlePromoAdClose}
              aria-label="Close promo"
            >
              ×
            </button>
            <span className="promo-modal-tag">Holiday Bonus</span>
            <h2>Extra {PROMO_DISCOUNT_PERCENT}% off today</h2>
            <p>
              Use code <span className="promo-code">{PROMO_CODE}</span> at checkout to
              take {PROMO_DISCOUNT_PERCENT}% off your cart.
            </p>
            <p className="promo-modal-note">
              * For Monthly Plans, discount applies to the first 6 months only.
            </p>
            <div className="promo-modal-actions">
              <button type="button" className="cta-button" onClick={handlePromoAdCopy}>
                Copy Code
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={handlePromoAdClose}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "cart" ? (
        <main className="cart-page section-fade">
          <div className="container">
            <h1 className="section-title cart-title">Shopping Cart</h1>
            <div className="cart-layout">
              {hasCartItems ? (
                <>
                  <section className="cart-items">
                    {cartItems.map((item) => {
                      const isFamilyItem = item.itemType === "family";
                      const itemSubtotal = getCartItemSubtotal(item);
                      const discountLabel = item.discountPercent
                        ? `${item.discountPercent}% OFF`
                        : "";

                      if (isFamilyItem) {
                        // Support both new and legacy cart items
                        const lineCount = item.lines || (item.bundleLines || []).length;
                        const pricePerLine = item.pricePerLine || 0;
                        const monthlyTotal = item.monthlyTotal || 0;
                        const lineDetails = item.lineDetails || [];
                        // Calculate prices for different terms
                        const price1Month = monthlyTotal;
                        const price3Months = monthlyTotal * 3;
                        const price6Months = monthlyTotal * 6;
                        const price12Months = monthlyTotal * 12;
                        return (
                          <div className="cart-item" key={item.id}>
                            <div className="cart-item-top">
                              <div className="cart-item-image">
                                <SimCardGraphic />
                              </div>
                              <div className="cart-item-details">
                                <div className="cart-item-heading">
                                  <span>
                                    Monthly Plan - {lineCount} line{lineCount > 1 ? "s" : ""}
                                  </span>
                                  <div className="cart-pill-group">
                                      <span className="cart-pill cart-pill-alt">
                                      Unlimited Data
                                      </span>
                                  </div>
                                </div>
                                <div className="cart-item-pricing">
                                <span className="cart-price">
                                  {formatMoney(itemSubtotal, true)} monthly
                                </span>
                                {pricePerLine > 0 && (
                                  <span className="cart-price-per-line">
                                    ({formatMoney(pricePerLine)}/line/mo)
                                  </span>
                                )}
                              </div>
                              {/* Show each line's details */}
                              <div className="cart-line-details">
                                {lineDetails.length > 0 ? (
                                  lineDetails.map((line, idx) => (
                                    <p className="cart-item-meta" key={idx}>
                                      {line.simType === "esim" ? "eSIM" : "Physical SIM"}
                                      {line.simType === "esim" && line.brand && line.model
                                        ? ` | ${line.brand} ${line.model}`
                                        : ""}
                                    </p>
                                  ))
                                ) : (
                              <p className="cart-item-meta">
                                    {lineCount} line{lineCount > 1 ? "s" : ""}
                                  </p>
                                )}
                                    </div>
                              {/* Show monthly billing info */}
                              <div className="cart-billing-info">
                                <p className="cart-billing-notice">
                                  Monthly billing - auto-renews each month until cancelled
                                </p>
                                <div className="cart-estimate-section">
                                  <p className="cart-estimate-title">Estimated costs:</p>
                                  <div className="cart-estimate-row">
                                    <span>3 Months:</span>
                                    <strong>{formatMoney(price3Months, true)}</strong>
                                </div>
                                  <div className="cart-estimate-row">
                                    <span>6 Months:</span>
                                    <strong>{formatMoney(price6Months, true)}</strong>
                                  </div>
                                  <div className="cart-estimate-row">
                                    <span>12 Months:</span>
                                    <strong>{formatMoney(price12Months, true)}</strong>
                                  </div>
                                </div>
                                </div>
                              </div>
                            </div>
                            <div className="cart-item-controls">
                              <div className="cart-qty cart-qty-static">
                                {lineCount} lines
                              </div>
                              <button
                                type="button"
                                className="cart-remove"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const details = getPlanDetails(item.term, item.planId);
                      const planLabel = getPlanDisplayLabel(item.planId, details);
                      const promoLabel = getPromoLabel(item.term, item.planId);
                      const strikeTotal = details.strike
                        ? details.strike * Number(item.term) * item.quantity
                        : null;
                      const simTypeLabel = item.simType === "esim" ? "eSIM" : "Physical SIM";
                      const deviceLabel = item.device ? formatDeviceLabel(item.device) : "";
                      return (
                        <div className="cart-item" key={item.id}>
                          <div className="cart-item-top">
                            <div className="cart-item-image">
                              <SimCardGraphic />
                            </div>
                            <div className="cart-item-details">
                              <div className="cart-item-heading">
                                <span>
                                  Upfront Plan - {formatTermShort(item.term)}, {planLabel}
                                </span>
                                <div className="cart-pill-group">
                                  {promoLabel && <span className="cart-pill">{promoLabel}</span>}
                                  {discountLabel && (
                                    <span className="cart-pill cart-pill-alt">
                                      {discountLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="cart-item-pricing">
                                {strikeTotal ? (
                                  <span className="cart-strike">
                                    {formatMoney(strikeTotal, true)}
                                  </span>
                                ) : null}
                                <span className="cart-price">
                                  {formatMoney(itemSubtotal, true)}
                                </span>
                              </div>
                              <p className="cart-item-meta">
                                SIM Type: {simTypeLabel}
                                {item.simType === "esim" && deviceLabel
                                  ? ` | ${deviceLabel}`
                                  : ""}
                              </p>
                              <button
                                type="button"
                                className="cart-link"
                                onClick={() =>
                                  handleCartSimToggle(
                                    item.id,
                                    item.simType === "esim" ? "psim" : "esim"
                                  )
                                }
                              >
                                Change to {item.simType === "esim" ? "Physical SIM" : "eSIM"} Card
                              </button>
                            </div>
                          </div>
                          <div className="cart-item-controls">
                            <div className="cart-qty">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => handleQuantityChange(item.id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="cart-remove"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {primaryCartItem ? (
                      <div className="cart-offer">
                        <p>
                          Limited Time Offer: Lock in 12 months for{" "}
                          {formatMoney(
                            getPlanDetails("12", primaryCartItem.planId).upfront
                          )}{" "}
                          and enjoy an entire year without a phone bill.
                        </p>
                        <button
                          type="button"
                          className="outline-button"
                          onClick={() => handleChangePlan(primaryCartItem)}
                        >
                          Change Plan
                        </button>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="outline-button add-another"
                      onClick={() => navigateTo("plan")}
                    >
                      Add Another Plan
                    </button>
                  </section>

                  <aside className="cart-summary">
                    <h2>Review Cart</h2>
                    <button type="button" className="cart-link" onClick={handlePromoToggle}>
                      Have a promo code?
                    </button>
                    {promoOpen && (
                      <div className="promo-form">
                        <input
                          type="text"
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(event) => {
                            setPromoCode(event.target.value);
                            if (promoMessage) {
                              setPromoMessage("");
                            }
                            if (promoApplied) {
                              setPromoApplied(false);
                              setPromoDiscount(0);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="outline-button"
                          onClick={handlePromoApply}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {promoMessage && (
                      <p className={`promo-message ${promoApplied ? "is-success" : "is-error"}`}>
                        {promoMessage}
                      </p>
                    )}
                    <div className="cart-summary-row">
                      <span>Subtotal</span>
                      <strong>{formatMoney(cartSubtotal, true)}</strong>
                    </div>
                    {promoApplied && cartPromoDiscount > 0 && (
                      <div className="cart-summary-row">
                        <span>
                          Promo ({promoCode.toUpperCase()} - {promoDiscount}%)
                        </span>
                        <strong>-{formatMoney(cartPromoDiscount, true)}</strong>
                      </div>
                    )}
                    <div className="cart-summary-row total">
                      <span>Total</span>
                      <strong>{formatMoney(cartTotal, true)}</strong>
                    </div>
                    <p className="cart-summary-note">Taxes and fees calculated at checkout</p>
                    <div className="cart-activation">
                      <div className="activation-icon">
                        <span />
                      </div>
                      <div>
                        <p className="activation-title">Activation made easy</p>
                        <p className="activation-text">
                          We'll provide step-by-step instructions on how to activate your
                          service and number right after purchase.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cta-button full-width"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </button>
                    <div className="payment-divider">Or</div>
                    <div className="payment-icons">
                      {["visa", "mastercard", "amex", "discover", "paypal"].map((icon) => (
                        <span key={icon} className="payment-pill">
                          {icon}
                        </span>
                      ))}
                    </div>
                  </aside>
                </>
              ) : (
                <div className="cart-empty">
                  <p>Your cart is empty.</p>
                  <button
                    type="button"
                    className="cta-button"
                    onClick={() => handleShopPlans("3")}
                  >
                    Shop Plans
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : view === "checkout" ? (
        <main className="checkout-page section-fade">
          <div className="container">
            <h1 className="checkout-title">Checkout</h1>
            <div className="checkout-layout">
              {/* Left Column - Forms */}
              <div className="checkout-forms">
                {/* Billing Details */}
                <section className="checkout-section">
                  <div className="checkout-section-header">
                    <h2>Billing Details</h2>
                    <span className="required-note">* required information</span>
                  </div>
                  <div className="checkout-form-grid">
                    <div className="form-field">
                      <input
                        type="text"
                        placeholder="First Name *"
                        value={checkoutBilling.firstName}
                        onChange={(e) => handleBillingChange("firstName", e.target.value)}
                        className={checkoutBilling.firstName ? "" : "field-required"}
                      />
                    </div>
                    <div className="form-field">
                      <input
                        type="text"
                        placeholder="Last Name *"
                        value={checkoutBilling.lastName}
                        onChange={(e) => handleBillingChange("lastName", e.target.value)}
                        className={checkoutBilling.lastName ? "" : "field-required"}
                      />
                    </div>
                    <div className="form-field full-width">
                      <input
                        type="text"
                        placeholder="Street Address *"
                        value={checkoutBilling.street}
                        onChange={(e) => handleBillingChange("street", e.target.value)}
                        className={checkoutBilling.street ? "" : "field-required"}
                      />
                    </div>
                    <div className="form-field full-width">
                      <input
                        type="text"
                        placeholder="Apartment, suite, unit, etc."
                        value={checkoutBilling.apartment}
                        onChange={(e) => handleBillingChange("apartment", e.target.value)}
                      />
                    </div>
                    <div className="form-field full-width">
                      <input
                        type="text"
                        placeholder="Town / City *"
                        value={checkoutBilling.city}
                        onChange={(e) => handleBillingChange("city", e.target.value)}
                        className={checkoutBilling.city ? "" : "field-required"}
                      />
                    </div>
                    <div className="form-field">
                      <select
                        value={checkoutBilling.state}
                        onChange={(e) => handleBillingChange("state", e.target.value)}
                        className={checkoutBilling.state ? "" : "field-required"}
                      >
                        <option value="">Select State *</option>
                        {US_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <input
                        type="text"
                        placeholder="Zip *"
                        value={checkoutBilling.zip}
                        onChange={(e) => handleBillingChange("zip", e.target.value)}
                        className={checkoutBilling.zip ? "" : "field-required"}
                      />
                    </div>
                    <div className="form-field full-width">
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={checkoutBilling.phone}
                        onChange={(e) => handleBillingChange("phone", e.target.value)}
                      />
                    </div>
                    <div className="form-field full-width">
                      <input
                        type="email"
                        placeholder="Email address *"
                        value={checkoutBilling.email}
                        onChange={(e) => handleBillingChange("email", e.target.value)}
                        className={checkoutBilling.email ? "" : "field-required"}
                      />
                    </div>
                  </div>
                  <label className="checkout-checkbox">
                    <input
                      type="checkbox"
                      checked={checkoutUseBillingAsShipping}
                      onChange={(e) => setCheckoutUseBillingAsShipping(e.target.checked)}
                    />
                    <span>Use billing address as shipping address</span>
                  </label>
                </section>

                {/* Shipping Details */}
                {!checkoutUseBillingAsShipping && (
                  <section className="checkout-section">
                    <div className="checkout-section-header">
                      <h2>Shipping Details</h2>
                      <span className="required-note">* required information</span>
                    </div>
                    <div className="checkout-form-grid">
                      <div className="form-field">
                        <input
                          type="text"
                          placeholder="First Name *"
                          value={checkoutShipping.firstName}
                          onChange={(e) => handleShippingChange("firstName", e.target.value)}
                          className={checkoutShipping.firstName ? "" : "field-required"}
                        />
                      </div>
                      <div className="form-field">
                        <input
                          type="text"
                          placeholder="Last Name *"
                          value={checkoutShipping.lastName}
                          onChange={(e) => handleShippingChange("lastName", e.target.value)}
                          className={checkoutShipping.lastName ? "" : "field-required"}
                        />
                      </div>
                      <div className="form-field full-width">
                        <input
                          type="text"
                          placeholder="Street Address *"
                          value={checkoutShipping.street}
                          onChange={(e) => handleShippingChange("street", e.target.value)}
                          className={checkoutShipping.street ? "" : "field-required"}
                        />
                      </div>
                      <div className="form-field full-width">
                        <input
                          type="text"
                          placeholder="Apartment, suite, unit, etc."
                          value={checkoutShipping.apartment}
                          onChange={(e) => handleShippingChange("apartment", e.target.value)}
                        />
                      </div>
                      <div className="form-field full-width">
                        <input
                          type="text"
                          placeholder="Town / City *"
                          value={checkoutShipping.city}
                          onChange={(e) => handleShippingChange("city", e.target.value)}
                          className={checkoutShipping.city ? "" : "field-required"}
                        />
                      </div>
                      <div className="form-field">
                        <select
                          value={checkoutShipping.state}
                          onChange={(e) => handleShippingChange("state", e.target.value)}
                          className={checkoutShipping.state ? "" : "field-required"}
                        >
                          <option value="">Select State *</option>
                          {US_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <input
                          type="text"
                          placeholder="Zip *"
                          value={checkoutShipping.zip}
                          onChange={(e) => handleShippingChange("zip", e.target.value)}
                          className={checkoutShipping.zip ? "" : "field-required"}
                        />
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column - Order Summary & Payment */}
              <div className="checkout-sidebar">
                {/* Order Summary */}
                <section className="checkout-section checkout-order-summary">
                  <h3>Your Order</h3>
                  <div className="order-table">
                    <div className="order-table-header">
                      <span>Product</span>
                      <span>Price</span>
                    </div>
                    {cartItems.map((item) => {
                      const isFamilyItem = item.itemType === "family";
                      const itemSubtotal = getCartItemSubtotal(item);
                      const originalPrice = item.originalPrice || 0;
                      const hasDiscount = originalPrice > 0 && originalPrice > itemSubtotal;

                      if (isFamilyItem) {
                        const lineCount = item.lines || 1;
                        const monthlyTotal = item.monthlyTotal || 0;
                        // Apply promo discount to monthly total
                        const monthlyWithPromo = promoApplied
                          ? monthlyTotal * (1 - promoDiscount / 100)
                          : monthlyTotal;
                        return (
                          <div className="order-table-row" key={item.id}>
                            <div className="order-product-info">
                              {promoApplied && <span className="order-discount-badge">{promoDiscount}% OFF</span>}
                              <span className="order-product-name">
                                Monthly Plan - {lineCount} line{lineCount > 1 ? "s" : ""}
                              </span>
                              <span className="order-product-meta">
                                SIM Type: {item.simType === "esim" ? "eSIM" : "Physical SIM"}
                              </span>
                            </div>
                            <div className="order-product-price">
                              <span className="order-price">{formatMoney(monthlyWithPromo, true)}/mo</span>
                              {promoApplied && (
                                <span className="order-original-price">{formatMoney(monthlyTotal, true)}/mo</span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Apply promo discount to upfront total
                      const itemWithPromo = promoApplied
                        ? itemSubtotal * (1 - promoDiscount / 100)
                        : itemSubtotal;
                      return (
                        <div className="order-table-row" key={item.id}>
                          <div className="order-product-info">
                            {promoApplied && <span className="order-discount-badge">{promoDiscount}% OFF</span>}
                            <span className="order-product-name">
                              Upfront Plan - {item.term} Month, {item.plan === "unlimited" ? "Unlimited" : item.plan}
                            </span>
                            <span className="order-product-meta">
                              SIM Type: {item.simType === "esim" ? "eSIM" : "Physical SIM"}
                              {item.simType === "esim" && item.brand && ` | ${item.brand} ${item.model}`}
                            </span>
                          </div>
                          <div className="order-product-price">
                            <span className="order-price">{formatMoney(itemWithPromo, true)}</span>
                            {promoApplied && (
                              <span className="order-original-price">{formatMoney(itemSubtotal, true)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(() => {
                      // Calculate upfront total (pay today) and monthly total
                      const upfrontSubtotal = cartItems
                        .filter((item) => item.itemType !== "family")
                        .reduce((sum, item) => sum + getCartItemSubtotal(item), 0);
                      const monthlySubtotal = cartItems
                        .filter((item) => item.itemType === "family")
                        .reduce((sum, item) => sum + (item.monthlyTotal || 0), 0);
                      
                      // Apply promo discount
                      const upfrontPromoDiscount = promoApplied && upfrontSubtotal > 0
                        ? (upfrontSubtotal * promoDiscount) / 100
                        : 0;
                      const monthlyPromoDiscount = promoApplied && monthlySubtotal > 0
                        ? (monthlySubtotal * promoDiscount) / 100
                        : 0;
                      
                      const upfrontTotal = Math.max(upfrontSubtotal - upfrontPromoDiscount, 0);
                      const monthlyWithDiscount = Math.max(monthlySubtotal - monthlyPromoDiscount, 0);
                      
                      const hasUpfront = upfrontSubtotal > 0;
                      const hasMonthly = monthlySubtotal > 0;

                      return (
                        <div className="order-table-row order-total">
                          <span>Due Today</span>
                          <div className="order-total-details">
                            <span className="order-total-amount">{formatMoney(upfrontTotal, true)}</span>
                            {hasMonthly && promoApplied && (
                              <div className="order-monthly-breakdown">
                                <span className="order-monthly-note">
                                  <strong>Months 1-6: {formatMoney(monthlyWithDiscount, true)}/mo</strong>
                                </span>
                                <span className="order-monthly-note order-monthly-after">
                                  After 6 months: {formatMoney(monthlySubtotal, true)}/mo
                                </span>
                              </div>
                            )}
                            {hasMonthly && !promoApplied && (
                              <span className="order-monthly-note">
                                <strong>+ {formatMoney(monthlySubtotal, true)}/mo auto-charged monthly</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </section>

                {/* Payment Methods */}
                <section className="checkout-section checkout-payment">
                  <div className="payment-options">
                    <label className={`payment-option ${checkoutPaymentMethod === "credit" ? "is-selected" : ""}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="credit"
                        checked={checkoutPaymentMethod === "credit"}
                        onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                      />
                      <span className="payment-option-icon">Credit Card 💳</span>
                    </label>
                  </div>

                  {checkoutPaymentMethod === "credit" && (
                    <div className="payment-card-form">
                      <div className="payment-card-header">
                        <h4>Payment</h4>
                        <span className="secure-badge">🔒 THIS SITE IS SSL SECURED</span>
                      </div>
                      <div className="form-field">
                        <label>Card Number *</label>
                        <div className="card-input-wrapper">
                          <input
                            type="text"
                            placeholder="💳"
                            value={checkoutCard.number}
                            onChange={(e) => handleCardChange("number", e.target.value)}
                            maxLength={19}
                          />
                          <span className="card-lock-icon">🔒</span>
                        </div>
                        <span className="card-hint">Pay with your MasterCard, Visa, Discover or American Express</span>
                      </div>
                      <div className="form-field">
                        <label>Expiration Date *</label>
                        <div className="expiration-inputs">
                          <select
                            value={checkoutCard.expMonth}
                            onChange={(e) => handleCardChange("expMonth", e.target.value)}
                          >
                            <option value="">Month</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <option key={m} value={String(m).padStart(2, "0")}>
                                {String(m).padStart(2, "0")}
                              </option>
                            ))}
                          </select>
                          <select
                            value={checkoutCard.expYear}
                            onChange={(e) => handleCardChange("expYear", e.target.value)}
                          >
                            <option value="">Year</option>
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-field">
                        <label>Card Security Code *</label>
                        <div className="cvv-input-wrapper">
                          <input
                            type="text"
                            placeholder="CVV"
                            value={checkoutCard.cvv}
                            onChange={(e) => handleCardChange("cvv", e.target.value)}
                            maxLength={4}
                          />
                          <span className="cvv-cards">💳💳</span>
                        </div>
                        <span className="card-hint">Your information is secure. ⓘ</span>
                      </div>
                    </div>
                  )}
                </section>

                {/* Terms & Place Order */}
                <section className="checkout-section checkout-terms">
                  <p className="terms-text">
                    By placing your order, you agree to our{" "}
                    <a href="#">Terms &amp; Conditions</a>,{" "}
                    <a href="#">Refund Policy</a> and <a href="#">Privacy Policy</a>.
                    Your personal data will be used to process your order, support your experience throughout this
                    website, and for other purposes described in our <a href="#">Privacy Policy</a>.
                  </p>
                  <p className="terms-text activation-notice">
                    <strong>Plans must be activated within 45 days.</strong>
                  </p>
                  <button
                    type="button"
                    className="place-order-btn"
                    onClick={handlePlaceOrder}
                  >
                    Place Order
                  </button>
                </section>
              </div>
            </div>
          </div>
        </main>
      ) : view === "plan" ? (
        <main>
          <section className="plan-selection section-fade">
            <div className="container split">
              <div className="left-rail">
                <div className="breadcrumbs">
                  <button type="button" onClick={() => navigateTo("home")}>
                    Home
                  </button>
                  <span>Phone Plans</span>
                  <span>{formatTermShort(selectedTerm)} Plans</span>
                </div>
                <SimCardGraphic className="large" />
              </div>
              <div className="plan-panel">
                <span className="holiday-pill">Holiday Savings</span>
                <h2>{formatTermLabel(selectedTerm)} Plans</h2>
                <p className="subtitle">5G / 4G LTE Plans for new customers</p>
                <div className="term-toggle">
                  {PLAN_TERMS.map((term) => (
                    <button
                      type="button"
                      key={term}
                      className={`term-tab ${selectedTerm === term ? "is-active" : ""}`}
                      onClick={() => handleTermSelect(term)}
                    >
                      {formatTermLabel(term)}
                    </button>
                  ))}
                </div>
                <div className="divider" />
                <p className="eyebrow">Pick Your Data Amount</p>
                <p className="subtext">
                  5G / 4G LTE Plan:{" "}
                  <strong>{activePlanLabel} for {formatTermPlural(selectedTerm)}</strong>
                </p>
                <div className="option-grid">
                  {PLAN_IDS.map((planId) => {
                    const planDetails = getPlanDetails(selectedTerm, planId);
                    const promo = getPromoLabel(selectedTerm, planId);
                    const planLabel = getPlanDisplayLabel(planId, planDetails);
                    return (
                      <button
                        type="button"
                        key={planId}
                        className={`option-card ${
                          selectedPlan === planId ? "is-active" : ""
                        }`}
                        onClick={() => handlePlanSelect(planId)}
                      >
                        {promo && <span className="option-pill">{promo}</span>}
                        <span className="option-title">{planLabel}</span>
                        <span className="option-price">
                          {planDetails.strike ? (
                            <span className="option-strike">
                              {formatMoney(planDetails.strike)}/mo
                            </span>
                          ) : null}
                          <span>{formatMoney(planDetails.monthly)}/mo</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="divider" />
                <div className="sim-type">
                  <p>
                    SIM Type: <strong>{simLabel}</strong>
                  </p>
                  <p>
                    Find the best fit for you -{" "}
                    <button type="button" className="text-link" onClick={handleCompareSim}>
                      Compare SIM types
                    </button>
                  </p>
                </div>
                <div className="option-grid sim-grid">
                  {[
                    {
                      id: "esim",
                      title: "eSIM (Digital Delivery)",
                      copy: "Easy same-day activation",
                    },
                    {
                      id: "psim",
                      title: "Physical SIM",
                      copy: "Get a SIM shipped to your door",
                    },
                  ].map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={`option-card ${
                        selectedSim === option.id ? "is-active" : ""
                      }`}
                      onClick={() => handleSimToggle(option.id)}
                    >
                      <span className="option-title">{option.title}</span>
                      <span className="option-sub">{option.copy}</span>
                    </button>
                  ))}
                </div>
                <div className="divider" />
                {selectedSim === "esim" ? (
                  <div className="phone-type">
                    <p className="eyebrow">Pick your phone type</p>
                    <p className="subtext">
                      You can activate your service immediately if your phone is eSIM
                      compatible.
                    </p>
                    <div className="select-row">
                      <select value={selectedBrand} onChange={handleBrandChange}>
                        <option value="">Select a brand</option>
                        {BRAND_OPTIONS.map((brand) => (
                          <option value={brand} key={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedModel}
                        onChange={handleModelChange}
                        disabled={!selectedBrand}
                      >
                        <option value="">Select a model</option>
                        {modelOptions.map((model) => (
                          <option value={model} key={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="phone-type phone-note">
                    <p className="eyebrow">Device selection not required</p>
                    <p className="subtext">
                      Physical SIM plans do not require a device selection. We will ship
                      a SIM kit to you.
                    </p>
                  </div>
                )}
                <div className="subtotal-row">
                  <span>Subtotal:</span>
                  <strong>
                    {formatMoney(activePlan.upfront)} for {formatTermPlural(selectedTerm)}
                  </strong>
                </div>
                {activePlanRegularTotal > 0 && (
                  <div className="regular-price">
                    Regular Price: <s>{formatMoney(activePlanRegularTotal)}</s>
                  </div>
                )}
                <button type="button" className="cta-button" onClick={handleAddToCart}>
                  Add to Cart
                </button>
                <p className="legal">
                  Upfront payment of {formatMoney(activePlan.upfront)} for{" "}
                  {formatTermShort(selectedTerm)} plan (equiv. to{" "}
                  {formatMoney(activePlan.monthly)}/mo). New customer offer for initial
                  plan term only; then full-price plan options available. Taxes and
                  fees extra. See full offer terms and expiration date. Availability,
                  speed and coverage vary by location.
                </p>
              </div>
            </div>
          </section>

          <section className="renewal-section section-fade section-delay-1">
            <div className="container split">
              <div className="left-rail">
                <SimCardGraphic className="large" />
              </div>
              <div className="renewal-column">
                <div className="renewal-panel">
                  <h2>What happens after {formatTermPlural(selectedTerm).toLowerCase()}?</h2>
                  <p className="subtitle">
                    The more months you buy, the more you save. When you're ready to
                    renew, simply do so in the app.
                  </p>
                  <div className="renewal-options">
                    {renewalOptions.map((option) => (
                      <div
                        className={`renewal-card ${option.active ? "is-active" : ""}`}
                        key={option.id}
                      >
                        {option.badge ? (
                          <span className="renewal-badge">{option.badge}</span>
                        ) : null}
                        <div>
                          <p className="renewal-title">{option.title}</p>
                          <p className="renewal-sub">
                            {formatMoney(option.total)} payment for {option.id} months
                          </p>
                        </div>
                        <strong>{formatMoney(option.price)}/mo</strong>
                      </div>
                    ))}
                  </div>
                  <div className="renewal-summary">
                    <div>
                      <p>
                        Current Plan: <strong>{activePlanLabel}</strong>
                      </p>
                      <p>
                        {formatTermLabel(selectedTerm)} New Customer Offer{" "}
                        <span>{formatMoney(activePlan.monthly)}/mo</span>
                      </p>
                    </div>
                    <div>
                      <p>
                        Renewal Plan: <strong>{activePlanLabel}</strong>
                      </p>
                      <p>
                        {formatTermLabel(selectedTerm)}{" "}
                        <span>{formatMoney(activePlan.renewalMonthly)}/mo</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="info-card">
                  <strong>Your plan, your way</strong>
                  <p>
                    You'll see your data usage so you can decide if you're on the right
                    plan. Move to a higher data plan at any time or switch to a lower
                    data plan when it is time to renew.
                  </p>
                </div>
                <div className="review-card">
                  <div className="quote-mark">"</div>
                  <p className="review-title">Shocked. Stunned. Amazed</p>
                  <p>
                    I recently switched from Verizon and I am stunned. Great service,
                    incredibly transparent, easy to switch and use, intuitive app that
                    tells you how much data you use, and more. Data streaming works
                    really well and I like the fact you can earn credits towards your
                    bill. Love it!
                  </p>
                  <p className="review-name">Eric F</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      ) : view === "family" ? (
        <main className="family-page">
          {/* T-Mobile style header */}
          <section className="family-header-section">
            <div className="container">
              <h1 className="family-main-title">
                {familyDiscountType ? (
                  <>Pick a plan with {DISCOUNT_LABELS[familyDiscountType]}</>
                ) : (
                  <>Pick a plan and you're in</>
                )}
              </h1>
              <p className="family-main-subtitle">
                However you want to live and stay connected, we've got you covered.
              </p>
              
              {/* Lines selector - T-Mobile style tabs */}
              <div className="family-lines-tabs">
                {[1, 2, 3, 4, 5].map((lines) => {
                  // Use "plus" as reference pricing when no plan is selected
                  const displayPlanType = familyPlanType || "plus";
                  const pricing = getFamilyPricing(displayPlanType, lines, familyDiscountType);
                  return (
                    <button
                      type="button"
                      key={lines}
                      className={`family-lines-tab ${familyLines === lines ? "is-active" : ""}`}
                      onClick={() => setFamilyLines(lines)}
                    >
                      <span className="lines-tab-count">{lines} line{lines > 1 ? "s" : ""}</span>
                    </button>
                  );
                })}
                  </div>
                </div>
          </section>

          {/* Plan cards - T-Mobile style */}
          <section className="family-plans-section">
            <div className="container">
              <div className="family-plans-grid">
                {Object.entries(FAMILY_PLAN_TYPES).map(([planId, planInfo]) => {
                  const pricing = getFamilyPricing(planId, familyLines, familyDiscountType);
                  const features = FAMILY_PLAN_FEATURES[planId] || [];
                  const isSelected = familyPlanType === planId;
                  
                  return (
                    <div
                      key={planId}
                      className={`family-plan-card ${isSelected ? "is-selected" : ""}`}
                      style={{ "--plan-color": planInfo.color }}
                    >
                      <div className="plan-card-header" style={{ backgroundColor: planInfo.color }}>
                        <h3>{planInfo.name}</h3>
                </div>
                      
                      <div className="plan-card-body">
                        <span className="plan-badge">{planInfo.badge}</span>
                        
                        <div className="plan-price-block">
                          <span className="plan-price-original">${pricing.original}</span>
                          <span className="plan-price-current">${pricing.monthly}</span>
                          <span className="plan-price-period">/month</span>
              </div>
                        
                        <p className="plan-price-note">
                          for {familyLines} phone line{familyLines > 1 ? "s" : ""} + taxes and fees
                        </p>
                        <p className="plan-price-connection">
                          + up to ${FAMILY_ADDITIONAL_CHARGES.deviceConnection} device connection charge per line
                        </p>
                        <p className="plan-autopay-note">
                          <span className="checkmark">✓</span> AutoPay discount using an eligible payment method applied
                        </p>
                        
                        <div className="plan-features-list">
                          {features.map((feature, idx) => (
                            <div key={idx} className={`plan-feature ${feature.highlight ? "highlight" : ""}`}>
                              <span className="feature-bullet">•</span>
                              <span>{feature.text}</span>
                </div>
                          ))}
                        </div>
                        
                    <button
                      type="button"
                          className="plan-compare-link"
                          onClick={() => setFamilyIncludesOpen((prev) => !prev)}
                    >
                          Compare all benefits
                    </button>
                        
                        {isSelected ? (
                          <div className="plan-selected-badge">
                            <span className="checkmark">✓</span> Selected
                          </div>
                            ) : (
                    <button
                      type="button"
                            className="plan-select-btn"
                            onClick={() => handleFamilyPlanTypeSelect(planId)}
                    >
                            Select plan
                    </button>
                            )}
                        
                        <div className="plan-savings">
                          <span>Annual savings - ${(
                            familyDiscountType && DISCOUNT_ANNUAL_SAVINGS[familyDiscountType]?.[planId]?.[familyLines]
                              ? DISCOUNT_ANNUAL_SAVINGS[familyDiscountType][planId][familyLines]
                              : (BROADBAND_FACTS_DATA[planId]?.annualSavingsByLines?.[familyLines] || BROADBAND_FACTS_DATA[planId]?.annualSavings || pricing.annualSavings)
                          ).toFixed(2)}</span>
                          <span className="arrow">→</span>
                  </div>
                        
                        {/* Broadband Facts */}
                        <div className="broadband-facts">
                          <div className="broadband-facts-header">
                            <strong>Broadband Facts</strong>
                            <span>Mobile Broadband Consumer Disclosure</span>
                </div>
                          <div className="broadband-facts-body">
                            <p className="provider">BudgetWise</p>
                            <p className="plan-name">{BROADBAND_FACTS_DATA[planId]?.name || planInfo.name}</p>
                    <button
                      type="button"
                              className="facts-toggle"
                              onClick={() => setFamilyIncludesOpen((prev) => !prev)}
                    >
                              {familyIncludesOpen ? "▲" : "▼"}
                    </button>
                        </div>
                          {familyIncludesOpen && (
                            <div className="broadband-facts-details">
                              <div className="facts-section-title">Monthly Price</div>
                              {Object.entries(BROADBAND_FACTS_DATA[planId]?.prices || {}).map(([lines, price]) => (
                                <div className="facts-row" key={lines}>
                                  <span>{lines} line{lines > 1 ? "s" : ""}</span>
                                  <strong>{typeof price === "number" ? `$${price}` : price}</strong>
                                </div>
                              ))}
                              {BROADBAND_FACTS_DATA[planId]?.additionalLines?.length > 0 && (
                                <>
                                  <div className="facts-subsection-title">Additional Lines</div>
                                  {BROADBAND_FACTS_DATA[planId].additionalLines.map((item) => (
                                    <div className="facts-row" key={item.range}>
                                      <span>{item.range}</span>
                                      <strong>{item.price}</strong>
                </div>
                                  ))}
                                </>
                              )}
                              <p className="facts-note">
                                This monthly price is not an introductory rate and does not require a yearly contract.
                              </p>
                              <p className="facts-note">
                                Does not include AutoPay or other discounts.
                              </p>
                              
                              <div className="facts-section-title">Additional Charges & Terms</div>
                              <div className="facts-subsection-title">Provider monthly fees</div>
                              <div className="facts-row">
                                <span>Regulatory programs / Telco recovery fee</span>
                                <strong>${FAMILY_ADDITIONAL_CHARGES.regulatoryFee}/line</strong>
              </div>
                              <div className="facts-row">
                                <span>Federal & Local Surcharges</span>
                                <strong>Typically ${FAMILY_ADDITIONAL_CHARGES.federalSurcharge}/line</strong>
                              </div>
                              <div className="facts-subsection-title">One-time fees</div>
                              <div className="facts-row">
                                <span>Device connection charge</span>
                                <strong>${FAMILY_ADDITIONAL_CHARGES.deviceConnection}/line</strong>
                              </div>
                              <div className="facts-row">
                                <span>Early termination fee</span>
                                <strong>$0</strong>
                              </div>
                              <div className="facts-row">
                                <span>Government taxes</span>
                                <strong>Varies by location</strong>
                              </div>
                              
                              <div className="facts-section-title">Discounts & Bundles</div>
                              <p className="facts-note">
                                There may be additional billing discounts available.
                              </p>
                              
                              <div className="facts-section-title">Speeds Provided with Plan</div>
                              <div className="facts-row">
                                <span>Typical Download Speed</span>
                                <strong>{BROADBAND_FACTS_DATA[planId]?.speeds?.download || "144-561 Mbps (5G)"}</strong>
                          </div>
                              <div className="facts-row">
                                <span>Typical Upload Speed</span>
                                <strong>{BROADBAND_FACTS_DATA[planId]?.speeds?.upload || "6-34 Mbps (5G)"}</strong>
                              </div>
                              <div className="facts-row">
                                <span>Typical Latency</span>
                                <strong>{BROADBAND_FACTS_DATA[planId]?.speeds?.latency || "15-27 ms"}</strong>
                              </div>
                              
                              <div className="facts-section-title">Data Included with Monthly Price</div>
                              <div className="facts-row">
                                <span>Data</span>
                                <strong>{planId === "essentials" ? "Unlimited" : "Unlimited"}</strong>
                              </div>
                              <div className="facts-row">
                                <span>Charges for Additional Data Usage</span>
                                <strong>$0</strong>
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                        </div>
                      );
                    })}
                  </div>
              
              {/* Discounts banner */}
                                <button
                                  type="button"
                className={`family-discounts-banner ${familyDiscountType ? "has-discount" : ""}`}
                onClick={() => setFamilyDiscountModalOpen(true)}
              >
                <div className="discount-banner-content">
                  {familyDiscountType ? (
                    <>
                      <span className="discount-applied-badge">✓ {DISCOUNT_LABELS[familyDiscountType]} Applied</span>
                      <span className="discount-change">Change or remove</span>
                              </>
                            ) : (
                    <>
                      <span>Discounts for military & veterans, and first responders</span>
                      <span className="verification">Verification required</span>
                    </>
                  )}
                </div>
                <span className="arrow">→</span>
                  </button>
                    </div>
          </section>

          {/* Discount selection modal */}
          {familyDiscountModalOpen && (
            <div className="discount-modal-overlay" onClick={() => setFamilyDiscountModalOpen(false)}>
              <div className="discount-modal" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                  className="discount-modal-close"
                  onClick={() => setFamilyDiscountModalOpen(false)}
                  aria-label="Close"
                >
                  ×
                        </button>
                <h2>Do any of these apply?</h2>
                <p className="discount-modal-subtitle">
                  Discounted plans require the primary account holder to verify eligibility within 45 days of enrollment.
                </p>
                <div className="discount-options">
                  <label className={`discount-option ${familyDiscountType === "first_responder" ? "is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="discount"
                      value="first_responder"
                      checked={familyDiscountType === "first_responder"}
                      onChange={() => setFamilyDiscountType("first_responder")}
                    />
                    <span className="discount-option-radio" />
                    <span className="discount-option-label">First responders</span>
                  </label>
                  <label className={`discount-option ${familyDiscountType === "military" ? "is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="discount"
                      value="military"
                      checked={familyDiscountType === "military"}
                      onChange={() => setFamilyDiscountType("military")}
                    />
                    <span className="discount-option-radio" />
                    <span className="discount-option-label">Military & veterans</span>
                  </label>
                  {familyDiscountType && (
                    <button
                      type="button"
                      className="discount-remove-btn"
                      onClick={() => setFamilyDiscountType("")}
                    >
                      Remove discount
                              </button>
                            )}
                          </div>
                            <button
                              type="button"
                  className="discount-continue-btn"
                  onClick={() => {
                    setFamilyDiscountModalOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                    >
                  Continue
                            </button>
                        </div>
                  </div>
          )}

          {/* Continue button */}
          <div className="family-continue-bar">
                  <button
                    type="button"
              className="family-continue-btn"
                    onClick={handleFamilyContinue}
                    disabled={!familyReady}
                  >
              Continue
                  </button>
              </div>

          {familyMessage && (
            <div className="family-message-bar">
              <p>{familyMessage}</p>
            </div>
          )}
        </main>
      ) : view === "family-confirm" ? (
        <main className="plan-confirm-page">
          <section className="plan-selection section-fade">
            <div className="container split">
              <div className="left-rail">
                <div className="breadcrumbs">
                  <button type="button" onClick={() => navigateTo("home")}>
                    Home
                        </button>
                  <button type="button" onClick={() => navigateTo("family")}>
                    Pay monthly
                  </button>
                  <span>Confirm Plan</span>
                </div>
                <SimCardGraphic />
              </div>
              <div className="right-content">
                <p className="plan-pay-monthly-label">Pay monthly</p>
                <h1 className="plan-selection-title">
                  {FAMILY_PLAN_TYPES[familyPlanType]?.name || "Family Plan"} - {familyLines} Line{familyLines > 1 ? "s" : ""}
                </h1>
                <p className="plan-selection-subtitle">
                  5G / 4G LTE Plans for {familyDiscountType ? DISCOUNT_LABELS[familyDiscountType] : "new customers"}
                </p>

                {/* Plan Summary */}
                <div className="confirm-plan-summary">
                  <p className="confirm-plan-label">SELECTED PLAN:</p>
                  <p className="confirm-plan-value">
                    {FAMILY_PLAN_TYPES[familyPlanType]?.name} for {familyLines} Line{familyLines > 1 ? "s" : ""}
                      </p>
                    </div>

                {/* SIM Type Selection for Each Line */}
                {Array.from({ length: familyLines }, (_, index) => (
                  <div className="line-config-section" key={index}>
                    <div className="line-config-header">
                      <h3 className="line-config-title">Line {index + 1}</h3>
                    </div>
                    
                    {/* SIM Type Selection */}
                    <div className="sim-type-section">
                      <p className="sim-type-label">
                        SIM Type: <strong>{familySim[index] === "esim" ? "eSIM" : "Physical SIM"}</strong>
                      </p>
                      {index === 0 && (
                        <p className="sim-type-hint">
                          Find the best fit for you - <button type="button" className="link-button" onClick={handleCompareSim}>Compare SIM types</button>
                        </p>
                      )}
                      <div className="sim-toggle-group">
                        <button
                          type="button"
                          className={`sim-toggle-btn ${familySim[index] === "esim" ? "is-active" : ""}`}
                          onClick={() => handleLineSimChange(index, "esim")}
                        >
                          <span className="sim-toggle-title">eSIM (Digital Delivery)</span>
                          <span className="sim-toggle-desc">Easy same-day activation</span>
                        </button>
                        <button
                          type="button"
                          className={`sim-toggle-btn ${familySim[index] === "psim" ? "is-active" : ""}`}
                          onClick={() => handleLineSimChange(index, "psim")}
                        >
                          <span className="sim-toggle-title">Physical SIM</span>
                          <span className="sim-toggle-desc">Get a SIM shipped to your door</span>
                        </button>
                    </div>
                    </div>

                    {/* Device Selection (for eSIM) */}
                    {familySim[index] === "esim" && (
                      <div className="device-section">
                        <p className="device-label">PICK YOUR PHONE TYPE</p>
                        <p className="device-hint">You can activate your service immediately if your phone is eSIM compatible.</p>
                        <div className="device-selects">
                          <select
                            className="device-select"
                            value={familyBrand[index] || ""}
                            onChange={(e) => handleLineBrandChange(index, e.target.value)}
                          >
                            <option value="">Select a brand</option>
                            {BRAND_OPTIONS.map((brand) => (
                              <option key={brand} value={brand}>
                                {brand}
                              </option>
                            ))}
                          </select>
                          <select
                            className="device-select"
                            value={familyModel[index] || ""}
                            onChange={(e) => handleLineModelChange(index, e.target.value)}
                            disabled={!familyBrand[index]}
                          >
                            <option value="">Select a model</option>
                            {familyBrand[index] &&
                              MODEL_OPTIONS[familyBrand[index]]?.map((model) => (
                                <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pricing Summary */}
                <div className="confirm-pricing-section">
                  <div className="confirm-pricing-row">
                    <span>Subtotal:</span>
                    <strong className="confirm-price">
                      ${getFamilyPricing(familyPlanType, familyLines, familyDiscountType).monthly.toFixed(2)} monthly
                          </strong>
                      </div>
                  <div className="confirm-pricing-row confirm-pricing-original">
                    <span>Regular Price:</span>
                    <span className="strike-price">
                      ${getFamilyPricing(familyPlanType, familyLines, familyDiscountType).original.toFixed(2)}
                    </span>
                  </div>
                    </div>

                {/* Add to Cart Button */}
                  <button
                    type="button"
                  className="add-to-cart-btn"
                    onClick={handleFamilyAddToCart}
                  >
                    Add to Cart
                  </button>

                {/* Back Button */}
                  <button
                    type="button"
                  className="back-to-plans-btn"
                  onClick={() => navigateTo("family")}
                  >
                  ← Back to Plans
                  </button>
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main>
          <section className="hero section-fade">
            <div className="container hero-inner">
              <span className="holiday-pill">Holiday Savings</span>
              <h1 className="hero-title">{HERO_COPY}</h1>
              <div className="plan-card">
                <h2>Choose Your Plan</h2>
                <p>All plans include the essential features.</p>
                <div className="feature-grid">
                  {FEATURE_ITEMS.map((item) => (
                    <div className={`feature-item ${item.type === "warning" ? "feature-item-warning" : ""}`} key={item.text}>
                      <span className={`feature-icon ${item.type === "warning" ? "feature-icon-warning" : ""}`}>
                        {item.type === "warning" ? <InfoIcon /> : <LeafIcon />}
                      </span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="plan-grid">
                  <div className="plan-grid-corner" />
                  {PLAN_TERMS.map((term) => (
                    <div className="plan-grid-header" key={term}>
                      <span>{formatTermPlural(term)}</span>
                      {term === "3" ? (
                        <span className="plan-grid-pill">New customer offer</span>
                      ) : null}
                    </div>
                  ))}
                  {PLAN_IDS.map((planId) => {
                    const rowLabel =
                      planId === "unlimited"
                        ? "Unlimited"
                        : `${PLAN_LABELS[planId]}/mo`;
                    return (
                      <div className="plan-grid-row" key={planId}>
                        <div className="plan-grid-label">{rowLabel}</div>
                        {PLAN_TERMS.map((term) => {
                          const details = getPlanDetails(term, planId);
                          const promo = getPromoLabel(term, planId);
                          return (
                            <div
                              className={`plan-grid-cell ${
                                planId === "unlimited" ? "is-highlight" : ""
                              }`}
                              key={`${planId}-${term}`}
                            >
                              {promo && planId === "unlimited" ? (
                                <span className="plan-grid-pill-inline">{promo}</span>
                              ) : null}
                              <div className="plan-grid-price">
                                {formatMoney(details.monthly)}/mo
                                {details.strike ? (
                                  <span className="plan-grid-old">
                                    {formatMoney(details.strike)}/mo
                                  </span>
                                ) : null}
                              </div>
                              <div className="plan-grid-note">
                                {formatMoney(details.upfront)} upfront payment required
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <div className="plan-cta-row">
                  {PLAN_TERMS.map((term) => (
                    <button
                      type="button"
                      key={term}
                      className="cta-button plan-cta"
                      onClick={() => handleShopPlans(term)}
                    >
                      Shop {formatTermLabel(term)} Plans
                    </button>
                  ))}
                </div>
                <p className="plan-legal">{HERO_LEGAL}</p>
              </div>
            </div>
          </section>

          <section className="facts-section section-fade section-delay-1">
            <div className="container">
              <h2 className="section-title">The Facts</h2>
              <div className="facts-toggle">
                {PLAN_TERMS.map((term) => (
                  <button
                    type="button"
                    key={term}
                    className={`facts-tab ${factsTerm === term ? "is-active" : ""}`}
                    onClick={() => handleFactsSelect(term)}
                  >
                    {formatTermLabel(term)}
                  </button>
                ))}
              </div>
              <div className="facts-grid">
                {FACTS_PLANS.map((plan) => {
                  const details = getPlanDetails(factsTerm, plan.id);
                  const planLabel = getPlanDisplayLabel(plan.id, details);
                  const isIntro = details.introMonthly !== details.renewalMonthly;
                  return (
                    <div className="facts-card" key={plan.id}>
                      <div className="facts-card-title">
                        {formatTermLabel(factsTerm)}, {planLabel}
                      </div>
                      <div className="facts-sheet">
                        <h3>Broadband Facts</h3>
                        <p>BudgetWise</p>
                        <p>{formatTermShort(factsTerm)} {planLabel}</p>
                        <div className="facts-divider" />
                        <div className="facts-row">
                          <span>Monthly Price</span>
                          <strong>{formatMoney(details.introMonthly, true)}</strong>
                        </div>
                        <p className="facts-note">
                          {isIntro
                            ? "This Monthly Price is an introductory rate."
                            : "This Monthly Price is not an introductory rate."}
                        </p>
                        <div className="facts-row">
                          <span>Length of Intro Period</span>
                          <strong>{formatTermPlural(factsTerm)}</strong>
                        </div>
                        <div className="facts-row">
                          <span>Regular Monthly Price</span>
                          <strong>{formatMoney(details.renewalMonthly, true)}</strong>
                        </div>
                        <p className="facts-note">
                          This Monthly Price does not require a contract.
                        </p>
                        <div className="facts-divider" />
                        <p className="facts-small">Additional Charges and Terms</p>
                        {Object.entries(details.providerMonthlyFees || {}).map(
                          ([label, value]) => (
                            <div className="facts-row" key={label}>
                              <span>{label}</span>
                              <strong>{formatFeeValue(value)}</strong>
                            </div>
                          )
                        )}
                        <div className="facts-row">
                          <span>One-Time Purchase Fees</span>
                          <strong>None</strong>
                        </div>
                        <div className="facts-row">
                          <span>Early Termination Fees</span>
                          <strong>None</strong>
                        </div>
                        <div className="facts-row">
                          <span>Government Taxes</span>
                          <strong>Varies by Location</strong>
                        </div>
                        <div className="facts-divider" />
                        <p className="facts-small">Discounts & Bundles</p>
                        <div className="facts-row">
                          <span>Discounts & Bundles</span>
                          <strong>None</strong>
                        </div>
                        <div className="facts-divider" />
                        <p className="facts-small">Speeds Provided with Plan</p>
                        <div className="facts-row">
                          <span>Typical Download Speed</span>
                          <strong>
                            {formatRange(
                              details.typicalSpeed?.download?.range,
                              details.typicalSpeed?.download?.units
                            )}
                          </strong>
                        </div>
                        <div className="facts-row">
                          <span>Typical Upload Speed</span>
                          <strong>
                            {formatRange(
                              details.typicalSpeed?.upload?.range,
                              details.typicalSpeed?.upload?.units
                            )}
                          </strong>
                        </div>
                        <div className="facts-row">
                          <span>Typical Latency</span>
                          <strong>
                            {formatRange(
                              details.typicalSpeed?.latency?.range,
                              details.typicalSpeed?.latency?.units
                            )}
                          </strong>
                        </div>
                        <div className="facts-divider" />
                        <p className="facts-small">Data Included with Monthly Price</p>
                        <div className="facts-row">
                          <span>Price</span>
                          <strong>
                            {details.dataIncluded?.amount}{" "}
                            {details.dataIncluded?.units || ""}
                          </strong>
                        </div>
                        <div className="facts-row">
                          <span>Charges for Additional Data Usage</span>
                          <strong>None</strong>
                        </div>
                        <div className="facts-divider" />
                        <p className="facts-small">Network Management</p>
                        <p className="facts-link">{details.networkManagementPolicyURL}</p>
                        <p className="facts-small">Privacy</p>
                        <p className="facts-link">{details.privacyPolicyURL}</p>
                        <p className="facts-small">Customer Support</p>
                        <p className="facts-link">Phone: {details.support?.number}</p>
                        <p className="facts-link">Website: {details.support?.URL}</p>
                        <div className="facts-divider" />
                        <p className="facts-footnote">
                          Learn more about the terms used on this label by visiting the
                          Federal Communications Commission.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="coverage-section section-fade section-delay-3">
            <div className="container coverage-grid">
              <div className="coverage-panel">
                <h2>Coverage & Device Checker</h2>
                <p>Check coverage by ZIP and confirm your phone works on BudgetWise.</p>
                <div className="coverage-form">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="ZIP code"
                    value={coverageZip}
                    onChange={(event) => {
                      setCoverageZip(event.target.value);
                      if (coverageMessage) {
                        setCoverageMessage("");
                      }
                    }}
                  />
                  <button type="button" className="cta-button" onClick={handleCoverageCheck}>
                    Check Coverage
                  </button>
                </div>
                {coverageMessage && <p className="coverage-message">{coverageMessage}</p>}
              </div>
              <div className="coverage-panel device-panel">
                <h3>Device Checker</h3>
                <p>Pick your phone and see if it is compatible.</p>
                <div className="select-row">
                  <select value={selectedBrand} onChange={handleBrandChange}>
                    <option value="">Select a brand</option>
                    {BRAND_OPTIONS.map((brand) => (
                      <option value={brand} key={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={!selectedBrand}
                  >
                    <option value="">Select a model</option>
                    {modelOptions.map((model) => (
                      <option value={model} key={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="outline-button"
                  onClick={handleDeviceCheck}
                >
                  Check Device
                </button>
                {deviceCheckMessage && (
                  <p className="coverage-message">{deviceCheckMessage}</p>
                )}
              </div>
            </div>
          </section>

          <section className="faq-section section-fade">
            <div className="container">
              <h2 className="section-title faq-title">
                There are no stupid questions, just frequently asked ones.
              </h2>
              <div className="faq-grid">
                {FAQ_ITEMS.map((item) => {
                  const isOpen = faqOpenId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`faq-item ${isOpen ? "is-open" : ""}`}
                    >
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => handleFaqToggle(item.id)}
                      >
                        <span>{item.question}</span>
                        <span className="faq-icon">{isOpen ? "-" : "+"}</span>
                      </button>
                      {isOpen && (
                        <div className="faq-answer">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

        </main>
      )}

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="budgetwise-logo footer-logo">
              <span>Budget</span>
              <span className="budgetwise-logo-light">Wise</span>
            </div>
            <p>Want to learn more about BudgetWise? Sign up for our newsletter.</p>
            <div className="footer-newsletter">
              <input
                type="email"
                placeholder="email address"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value);
                  if (newsletterMessage) {
                    setNewsletterMessage("");
                  }
                }}
              />
              <button type="button" className="cta-button" onClick={handleSubscribe}>
                Subscribe
              </button>
            </div>
            {newsletterMessage && <p className="newsletter-message">{newsletterMessage}</p>}
            <div className="footer-socials">
              {["ig", "x", "fb"].map((social) => (
                <span key={social} className="social-pill">
                  {social}
                </span>
              ))}
            </div>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div className="footer-links" key={group.title}>
              <h4>{group.title}</h4>
              {group.links.map((link) => (
                <span key={link}>{link}</span>
              ))}
            </div>
          ))}
        </div>
      </footer>

      <button
        type="button"
        className="chat-bubble"
        aria-label="Chat"
        onClick={() => notify("Chat is not available in this demo.")}
      >
        <ChatIcon />
      </button>
    </div>
  );
}

export default App;
