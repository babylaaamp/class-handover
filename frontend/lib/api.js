const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
export const token = () => typeof window === "undefined" ? null : localStorage.getItem("class_handover_token");
export const saveToken = value => localStorage.setItem("class_handover_token", value);
export const logout = () => { localStorage.removeItem("class_handover_token"); window.location.href = "/login"; };
export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  if (options.body && !(options.body instanceof URLSearchParams) && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  let response;
  try { response = await fetch(BASE + path, { ...options, headers }); }
  catch { throw new Error("Failed to fetch: ตรวจ Backend URL และ CORS"); }
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error(data?.detail || `HTTP ${response.status}`);
  return data;
}
export const jsonBody = value => JSON.stringify(value);
