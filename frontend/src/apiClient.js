const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

// Get cookie override from URL query parameter if present
const getCookieOverride = () => {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get("cookie");
};

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  
  // Append cookie override to path if present in URL
  let requestPath = path;
  const cookieOverride = getCookieOverride();
  if (cookieOverride) {
    const separator = path.includes("?") ? "&" : "?";
    requestPath = `${path}${separator}cookie=${encodeURIComponent(cookieOverride)}`;
  }
  
  const response = await fetch(`${API_BASE}${requestPath}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || "Request failed";
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  baseUrl: API_BASE,
  getBudgetwiseSession: () => request("/budgetwise/session"),
  savePreferences: (payload) =>
    request("/budgetwise/preferences", { method: "PUT", body: JSON.stringify(payload) }),
  saveFamily: (payload) =>
    request("/budgetwise/family", { method: "PUT", body: JSON.stringify(payload) }),
  validateFamily: (payload) =>
    request("/budgetwise/family/validate", { method: "POST", body: JSON.stringify(payload) }),
  saveCoverageDraft: (zip) =>
    request("/budgetwise/coverage", { method: "PUT", body: JSON.stringify({ zip }) }),
  checkCoverage: (zip) =>
    request("/budgetwise/coverage/check", { method: "POST", body: JSON.stringify({ zip }) }),
  checkDevice: (brand, model) =>
    request("/budgetwise/devices/check", { method: "POST", body: JSON.stringify({ brand, model }) }),
  savePromoDraft: (payload) =>
    request("/budgetwise/promo", { method: "PUT", body: JSON.stringify(payload) }),
  applyPromo: (code) =>
    request("/budgetwise/promo/apply", { method: "POST", body: JSON.stringify({ code }) }),
  saveNewsletterDraft: (email) =>
    request("/budgetwise/newsletter", { method: "PUT", body: JSON.stringify({ email }) }),
  subscribeNewsletter: (email) =>
    request("/budgetwise/newsletter/subscribe", { method: "POST", body: JSON.stringify({ email }) }),
  addPlanToCart: (payload) =>
    request("/budgetwise/cart/plans", { method: "POST", body: JSON.stringify(payload) }),
  addFamilyToCart: (payload) =>
    request("/budgetwise/cart/family", { method: "POST", body: JSON.stringify(payload) }),
  updateCartItem: (itemId, payload) =>
    request(`/budgetwise/cart/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH", body: JSON.stringify(payload),
    }),
  removeCartItem: (itemId) =>
    request(`/budgetwise/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" }),
  checkoutCart: () => request("/budgetwise/cart/checkout", { method: "POST" }),
  getInfo: () => request("/info"),
  listFiles: () => request("/files"),
  uploadFiles: (files = []) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request("/files", { method: "POST", body: formData });
  },
};
