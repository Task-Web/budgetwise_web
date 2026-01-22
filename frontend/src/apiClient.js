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
  getState: () => request("/state"),
  replaceState: (data, note, meta) =>
    request("/state", { method: "PUT", body: JSON.stringify({ data, note, meta }) }),
  patchState: (data, note) => request("/state", { method: "PATCH", body: JSON.stringify({ data, note }) }),
  resetState: () => request("/state", { method: "DELETE" }),
  getInfo: () => request("/info"),
  listFiles: () => request("/files"),
  uploadFiles: (files = []) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request("/files", { method: "POST", body: formData });
  },
};
