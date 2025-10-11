// src/api/utils/parse.js
export async function parseJsonSafe(res) {
  if (res.status === 204) return null;                 // No Content
  const text = await res.text();

  if (!text || !text.trim()) return null;              // boş body

  // BOM ve Angular JSON-hijack prefix temizliği
  const cleaned = text
    .replace(/^\uFEFF/, '')         // UTF-8 BOM
    .replace(/^\)\]\}',?\s*/, '');  // )]}',

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Teşhis için ilk 200 karakteri logla
    console.error("Non-JSON response:", cleaned.slice(0, 200));
    throw new Error(`Non-JSON response (${res.status})`);
  }
}

// müşteri getir
export async function apiGetCustomer(id) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
  const res = await fetch(`${backendUrl}/api/customers/${id}`, {
    credentials: "include",
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`GET /customers/${id} ${res.status}`);
  return await parseJsonSafe(res); // { customer: ... }
}

// müşteri patch
export async function apiPatchCustomer(id, payload) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
  const res = await fetch(`${backendUrl}/api/customers/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 204) return null; // gövde yoksa normal
  if (!res.ok) {
    // JSON olmayan hata gövdesini yutma; logla
    await parseJsonSafe(res).catch(() => null);
    throw new Error(`PATCH /customers/${id} ${res.status}`);
  }
  return await parseJsonSafe(res); // { customer, auditId } vb.
}

// müşteri oluştur
export async function apiPostCustomer(payload) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
  const res = await fetch(`${backendUrl}/api/customers`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await parseJsonSafe(res).catch(() => null);
    throw new Error(`POST /customers ${res.status}`);
  }
  return await parseJsonSafe(res);
}