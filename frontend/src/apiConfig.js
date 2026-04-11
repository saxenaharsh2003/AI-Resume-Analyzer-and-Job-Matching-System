/**
 * Single source of truth for the FastAPI base URL.
 * Prefer VITE_API_URL in .env; default matches backend on same host (127.0.0.1 avoids localhost CORS quirks).
 */
const DEFAULT_API_BASE = "http://127.0.0.1:8000";

export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  const base = typeof raw === "string" && raw.trim() ? raw.trim() : DEFAULT_API_BASE;
  return base.replace(/\/$/, "");
}

/** Full URL for an API path (path must start with `/`, e.g. `/api/v1/analyze`). */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${p}`;
}

/** Normalize FastAPI `detail` (string, validation array, or object). */
export function formatFastApiDetail(data) {
  if (data == null || typeof data !== "object") return "Request failed.";
  const d = data.detail;
  if (d == null) return "Request failed.";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((item) => (typeof item === "string" ? item : item?.msg || JSON.stringify(item)))
      .join(" ");
  }
  if (typeof d === "object" && typeof d.msg === "string") return d.msg;
  return String(d);
}

/**
 * Read response body once as JSON if possible; otherwise wrap text in `{ detail }`.
 */
export async function readJsonOrTextBody(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text.slice(0, 800) };
  }
}
