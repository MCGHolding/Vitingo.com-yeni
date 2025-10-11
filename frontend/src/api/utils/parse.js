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

export async function getCustomer(id) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
  const res = await fetch(`${backendUrl}/api/customers/${id}`, {
    credentials: "include",
    headers: { 
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
  });
  if (!res.ok) {
    const errorBody = await parseJsonSafe(res).catch(() => null);
    throw new Error(`GET /customers/${id} failed (${res.status}): ${errorBody ? JSON.stringify(errorBody) : 'Unknown error'}`);
  }
  return await parseJsonSafe(res);
}

export async function patchCustomer(id, payload) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
  
  console.log('PATCH Customer payload:', payload);
  console.log('PATCH Customer JSON:', JSON.stringify(payload, null, 2));
  
  const res = await fetch(`${backendUrl}/api/customers/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log('PATCH Response status:', res.status);
  console.log('PATCH Response headers:', [...res.headers.entries()]);

  // Bazı backend'ler 204 döndürebilir; bunu normal kabul ediyoruz
  if (res.status === 204) return null;

  if (!res.ok) {
    // JSON olmayan hata gövdesi burada yakalanır
    const errBody = await parseJsonSafe(res).catch(() => null);
    throw new Error(`PATCH failed (${res.status}) ${errBody ? JSON.stringify(errBody) : "Unknown error"}`);
  }
  return await parseJsonSafe(res);
}

export async function postCustomer(payload) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
  
  console.log('POST Customer payload:', payload);
  console.log('POST Customer JSON:', JSON.stringify(payload, null, 2));
  
  const res = await fetch(`${backendUrl}/api/customers`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log('POST Response status:', res.status);
  console.log('POST Response headers:', [...res.headers.entries()]);

  if (!res.ok) {
    const errBody = await parseJsonSafe(res).catch(() => null);
    throw new Error(`POST failed (${res.status}) ${errBody ? JSON.stringify(errBody) : "Unknown error"}`);
  }
  return await parseJsonSafe(res);
}