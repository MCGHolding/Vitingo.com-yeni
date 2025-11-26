// --- Code/Label sözlükleri (DB'de kod, UI'da label) ---
export const CUSTOMER_TYPES = {
  ajans: "Ajans",
  mevcut_musteri: "Mevcut Müşteri",
  yeni_musteri: "Yeni Müşteri",
  vip_musteri: "VIP Müşteri",
  firma: "Firma",
  dernek_vakif: "Dernek veya Vakıf",
  devlet_kurumu: "Devlet Kurumu",
  holding_sirketi: "Holding Şirketi",
  vakif_sirketi: "Vakıf Şirketi",
};

export const SECTORS = {
  bankacilik: "Bankacılık",
  gida_icecek: "Gıda-İçecek",
  otomotiv: "Otomotiv",
  teknoloji: "Teknoloji",
  saglik: "Sağlık",
  egitim: "Eğitim",
  turizm: "Turizm",
  insaat: "İnşaat",
  tekstil: "Tekstil",
  lojistik: "Lojistik",
  enerji: "Enerji",
  diger: "Diğer",
};

// label→code yardımcıları
const labelToCode = (dict, label) =>
  Object.entries(dict).find(([,v]) => v === (label ?? ""))?.[0];

const codeToLabel = (dict, code) => dict[code] || "";

const safe = (v, fallback) => (v == null ? fallback : v);

// --- DB -> FORM (Edit açılışında) ---
export function dbToForm(c) {
  if (!c) return getEmptyForm();
  
  console.log("DB RAW:", c);
  
  const formData = {
    // Kategori Seçimi
    customerType: codeToLabel(CUSTOMER_TYPES, c.relationshipType),
    sector: codeToLabel(SECTORS, c.sector),
    source: c.source || "",
    status: c.status || "",
    isIndividual: !!c.isIndividual,
    isProspect: !!c.isProspect,

    // Firma Bilgileri
    company_short_name: safe(c.companyName, ""),
    company_title: safe(c.companyTitle, ""),
    customer_type_id: c.relationshipType || "mevcut_musteri",
    specialty_id: c.sector || "",
    address: safe(c.address, ""),
    country: safe(c.country, ""),
    city: safe(c.city, ""),
    
    // Vergi Bilgileri (Firma Bilgileri altında)
    tax_office: c.taxOffice || "",
    tax_number: c.taxNumber || "",
    
    // Hizmetler (Firma Bilgileri altında)
    services: Array.isArray(c.services) ? c.services : [],

    // İletişim Bilgileri
    phone: c.phone || "",
    mobile: c.mobile || "",
    email: c.email || "",

    // İletişim Kişisi Detayları
    contactPerson: c.contactPerson || "",
    contact_mobile: c.contactMobile || "",
    contact_email: c.contactEmail || "",
    contact_position: c.contactPosition || "",
    contact_address: c.contactAddress || "",
    contact_country: c.contactCountry || "",
    contact_city: c.contactCity || "",

    // Banka Ödeme Bilgileri
    account_holder_name: c.accountHolderName || "",
    iban: c.iban || "",
    bank_name: c.bankName || "",
    bank_branch: c.bankBranch || "",
    swift_code: c.swiftCode || "",
    currency: c.currency || "TRY",

    // Diğer
    tags: Array.isArray(c.tags) ? c.tags : [],
    notes: c.notes || "",
  };

  console.log("FORM INIT:", formData);
  return formData;
}

// --- FORM -> DB (Create kaydet / Edit patch) ---
export function formToDb(v) {
  return {
    // Kategori → DB codes
    relationshipType: labelToCode(CUSTOMER_TYPES, v.customerType) || v.customer_type_id || "mevcut_musteri",
    sector: labelToCode(SECTORS, v.sector) || v.specialty_id || "",
    source: v.source || "",
    status: v.status || "",
    
    // Firma Bilgileri
    companyName: v.company_short_name?.trim() || "",
    companyTitle: v.company_title?.trim() || "",
    address: v.address || "",
    country: v.country || "",
    city: v.city || "",
    
    // Vergi Bilgileri
    taxOffice: v.tax_office || "",
    taxNumber: v.tax_number || "",
    
    // Hizmetler
    services: Array.isArray(v.services) ? v.services : [],

    // İletişim Bilgileri
    phone: v.phone || "",
    mobile: v.mobile || "",
    email: v.email || "",

    // İletişim Kişisi Detayları
    contactPerson: v.contactPerson || "",
    contactMobile: v.contact_mobile || "",
    contactEmail: v.contact_email || "",
    contactPosition: v.contact_position || "",
    contactAddress: v.contact_address || "",
    contactCountry: v.contact_country || "",
    contactCity: v.contact_city || "",

    // Banka Ödeme Bilgileri
    accountHolderName: v.account_holder_name || "",
    iban: v.iban || "",
    bankName: v.bank_name || "",
    bankBranch: v.bank_branch || "",
    swiftCode: v.swift_code || "",
    currency: v.currency || "TRY",

    // Diğer
    tags: Array.isArray(v.tags) ? v.tags : [],
    notes: v.notes || "",
    
    // Meta
    isIndividual: !!v.isIndividual,
    isProspect: !!v.isProspect,
  };
}

// --- Boş form default değerleri ---
export function getEmptyForm() {
  return {
    customerType: "",
    sector: "",
    isIndividual: false,
    isProspect: false,

    company_short_name: "",
    company_title: "",
    customer_type_id: "mevcut_musteri",
    specialty_id: "",
    address: "",
    country: "",
    city: "",
    
    tax_office: "",
    tax_number: "",
    services: [],

    phone: "",
    mobile: "",
    email: "",

    contactPerson: "",
    contact_mobile: "",
    contact_email: "",
    contact_position: "",
    contact_address: "",
    contact_country: "",
    contact_city: "",

    account_holder_name: "",
    iban: "",
    bank_name: "",
    bank_branch: "",
    swift_code: "",
    currency: "TRY",

    tags: [],
    notes: "",
  };
}

// --- (Opsiyonel) Diff: PATCH sadece değişen alanları göndersin ---
export function deepDiff(next, prev) {
  if (typeof next !== "object" || next === null) return next === prev ? undefined : next;
  const out = Array.isArray(next) ? [] : {};
  const keys = new Set([...Object.keys(next || {}), ...Object.keys(prev || {})]);
  for (const k of keys) {
    const v = deepDiff(next?.[k], prev?.[k]);
    if (v !== undefined) out[k] = v;
  }
  return (Array.isArray(out) ? out.length : Object.keys(out).length) ? out : undefined;
}

// --- Dropdown data helpers ---
export function getCustomerTypeOptions() {
  return Object.entries(CUSTOMER_TYPES).map(([value, name]) => ({ value, name }));
}

export function getSectorOptions() {
  return Object.entries(SECTORS).map(([value, name]) => ({ value, name }));
}