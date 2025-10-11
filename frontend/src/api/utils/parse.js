// api/utils/parse.js
export async function parseJsonSafe(res) {
  // 204 No Content ise JSON parse etmeye çalışma
  if (res.status === 204) return null;

  const text = await res.text();

  // Tamamen boş body ise null döndür
  if (!text || !text.trim()) return null;

  // UTF-8 BOM ve Angular JSON-hijacking prefix'lerini temizle
  const cleaned = text
    .replace(/^\uFEFF/, '')          // BOM
    .replace(/^\)\]\}',?\s*/, '');   // )]}',

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Tanı koymayı kolaylaştırmak için ilk 200 karakteri logla
    console.error("Non-JSON response:", cleaned.slice(0, 200));
    console.error("Response status:", res.status);
    console.error("Response headers:", [...res.headers.entries()]);
    throw new Error(`Non-JSON response (${res.status}): ${cleaned.slice(0, 120)}`);
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