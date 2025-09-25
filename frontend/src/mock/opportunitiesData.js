// Mock data for open opportunities based on the uploaded screenshot
export const openOpportunities = [
  {
    id: 325,
    customer: 'Doratek Medikal',
    eventName: 'Medica 2025',
    amount: 18000.00,
    currency: 'EUR',
    status: 'open-active',
    statusText: 'Açık - Aktif - Teklif Bekleniyor',
    tags: ['ALMANYA', 'DÜSSELDORF', 'MEDICA'],
    lastUpdate: '2024-01-20',
    contactPerson: 'Ahmet Kaya'
  },
  {
    id: 319,
    customer: 'Meyer',
    eventName: 'Avrasya Ambalaj Fuarı 2025',
    amount: 7000.00,
    currency: 'EUR',
    status: 'open-active',
    statusText: 'Açık - Aktif - Teklif Bekleniyor',
    tags: [],
    lastUpdate: '2024-01-19',
    contactPerson: 'Zeynep Demir'
  },
  {
    id: 322,
    customer: 'Biçakçılar',
    eventName: 'Medica 2025',
    amount: 0,
    currency: 'EUR',
    status: 'open-active',
    statusText: 'Açık - Aktif - Tasarıma Yanıt Bekleniyor',
    tags: ['ALMANYA', 'DÜSSELDORF', 'MEDICA'],
    lastUpdate: '2024-01-18',
    contactPerson: 'Mehmet Özkan'
  },
  {
    id: 291,
    customer: 'Rella Gıda',
    eventName: 'Gulfood 2026',
    amount: 17000.00,
    currency: 'USD',
    status: 'open-active',
    statusText: 'Açık - Aktif - Teklif Gönderildi',
    tags: ['BAE', 'DUBAİ', 'GULFOOD'],
    lastUpdate: '2024-01-17',
    contactPerson: 'Fatma Yılmaz'
  },
  {
    id: 324,
    customer: 'Shazel',
    eventName: 'Prodexpo 2026',
    amount: 0,
    currency: 'EUR',
    status: 'open-active',
    statusText: 'Açık - Aktif - Tasarım Bekliyor',
    tags: [],
    lastUpdate: '2024-01-16',
    contactPerson: 'Ali Korkmaz'
  },
  {
    id: 316,
    customer: 'Kipaş',
    eventName: 'A+A 2025',
    amount: 24500.00,
    currency: 'EUR',
    status: 'open-active',
    statusText: 'Açık - Aktif - Teklif Gönderildi',
    tags: ['A+A', 'ALMANYA', 'DÜSSELDORF'],
    lastUpdate: '2024-01-15',
    contactPerson: 'Selin Kaya'
  },
  {
    id: 310,
    customer: 'Birinci',
    eventName: 'Agritechnica 2025',
    amount: 3750.00,
    currency: 'EUR',
    status: 'open-active',
    statusText: 'Açık - Aktif - Teklif Gönderildi',
    tags: ['AGRITECHNICA', 'ALMANYA', 'HANNOVER'],
    lastUpdate: '2024-01-14',
    contactPerson: 'Can Şimşek'
  },
  {
    id: 216,
    customer: 'Albond',
    eventName: 'Toronto Building 2025',
    amount: 32000.00,
    currency: 'USD',
    status: 'open-active',
    statusText: 'Açık - Aktif - Teklif Gönderildi',
    tags: ['BUILDING SHOW', 'KANADA', 'TORONTO'],
    lastUpdate: '2024-01-13',
    contactPerson: 'Ayşe Polat'
  },
  {
    id: 217,
    customer: 'Albond',
    eventName: 'IBS 2026',
    amount: 24000.00,
    currency: 'USD',
    status: 'open-active',
    statusText: 'Açık - Aktif - Teklif Gönderildi',
    tags: ['ABD', 'IBS', 'ORLANDO'],
    lastUpdate: '2024-01-12',
    contactPerson: 'Ayşe Polat'
  },
  {
    id: 284,
    customer: 'Martin Star',
    eventName: 'Gulfood 2026',
    amount: 0,
    currency: 'EUR',
    status: 'open-active',
    statusText: 'Açık - Aktif - Brief Bekleniyor',
    tags: ['BAE', 'DUBAİ', 'GULFOOD'],
    lastUpdate: '2024-01-11',
    contactPerson: 'Murat Aksoy'
  },
  {
    id: 323,
    customer: 'Ares Medikal',
    eventName: 'Expomed Eurasia 2026',
    amount: 0,
    currency: 'EUR',
    status: 'open-active',
    statusText: 'Açık - Aktif - Tasarım Bekliyor',
    tags: ['EXPOMED', 'İSTANBUL', 'TÜRKİYE'],
    lastUpdate: '2024-01-10',
    contactPerson: 'Elif Tuncer'
  },
  {
    id: 305,
    customer: 'Remed Asistance',
    eventName: '4. Uluslararası Sigorta Zirvesi',
    amount: 108000.00,
    currency: 'TRY',
    status: 'open-active',
    statusText: 'Açık - Aktif - Teklif Gönderildi',
    tags: ['İSTANBUL', 'TICE KONGRESI', 'TÜRKİYE'],
    lastUpdate: '2024-01-09',
    contactPerson: 'Hasan Çelik'
  }
];

export const opportunityStatusOptions = [
  { value: 'all', label: 'Tümü', color: 'bg-gray-100 text-gray-800' },
  { value: 'open-active', label: 'Açık - Aktif', color: 'bg-green-100 text-green-800' },
  { value: 'pending-quote', label: 'Teklif Bekleniyor', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'quote-sent', label: 'Teklif Gönderildi', color: 'bg-blue-100 text-blue-800' },
  { value: 'design-pending', label: 'Tasarım Bekliyor', color: 'bg-purple-100 text-purple-800' }
];

export const tagColors = {
  'ALMANYA': 'bg-red-500 text-white',
  'DÜSSELDORF': 'bg-purple-500 text-white',
  'MEDICA': 'bg-teal-500 text-white',
  'BAE': 'bg-red-500 text-white',
  'DUBAİ': 'bg-orange-500 text-white',
  'GULFOOD': 'bg-teal-500 text-white',
  'A+A': 'bg-teal-500 text-white',
  'AGRITECHNICA': 'bg-teal-500 text-white',
  'HANNOVER': 'bg-purple-500 text-white',
  'BUILDING SHOW': 'bg-teal-500 text-white',
  'KANADA': 'bg-purple-500 text-white',
  'TORONTO': 'bg-teal-500 text-white',
  'ABD': 'bg-purple-500 text-white',
  'IBS': 'bg-teal-500 text-white',
  'ORLANDO': 'bg-purple-500 text-white',
  'EXPOMED': 'bg-teal-500 text-white',
  'İSTANBUL': 'bg-purple-500 text-white',
  'TÜRKİYE': 'bg-red-500 text-white',
  'TICE KONGRESI': 'bg-teal-500 text-white'
};