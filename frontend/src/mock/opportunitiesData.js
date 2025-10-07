// Mock data removed - now using real API data
export const openOpportunities = [];

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

// Won opportunities data removed - now using real API data
export const wonOpportunities = [];

// Lost opportunities data removed - now using real API data
export const lostOpportunities = [];

// Favorite opportunities data
export const favoriteOpportunities = [
  {
    id: 601,
    customer: 'Premium Medical Group',
    eventName: 'Global Health Innovation',
    amount: 35000.00,
    currency: 'EUR',
    status: 'favorite-active',
    statusText: 'Favori - VIP Müşteri',
    tags: ['İSVİÇRE', 'ZÜRICH', 'PREMIUM'],
    lastUpdate: '2024-01-21',
    contactPerson: 'Dr. Helena Weber',
    priority: 'VIP',
    relationship: '5 yıllık müşteri'
  },
  {
    id: 602,
    customer: 'Strategic Partner Corp.',
    eventName: 'Partnership Summit 2024',
    amount: 50000.00,
    currency: 'USD',
    status: 'favorite-pending',
    statusText: 'Favori - Stratejik Ortak',
    tags: ['ABD', 'SAN FRANCISCO', 'STRATEGY'],
    lastUpdate: '2024-01-20',
    contactPerson: 'Alexandra Stone',
    priority: 'Strategic',
    relationship: 'Uzun vadeli ortak'
  },
  {
    id: 603,
    customer: 'Loyal Customer Inc.',
    eventName: 'Annual Partnership Meeting',
    amount: 28000.00,
    currency: 'EUR',
    status: 'favorite-negotiation',
    statusText: 'Favori - Sadık Müşteri',
    tags: ['ALMANYA', 'HAMBURG', 'LOYAL'],
    lastUpdate: '2024-01-19',
    contactPerson: 'Thomas Richter',
    priority: 'High',
    relationship: '10+ proje geçmişi'
  },
  {
    id: 604,
    customer: 'Innovation Leaders Ltd.',
    eventName: 'Future Technology Expo',
    amount: 42000.00,
    currency: 'USD',
    status: 'favorite-active',
    statusText: 'Favori - İnovasyon Lideri',
    tags: ['İNGİLTERE', 'LONDON', 'INNOVATION'],
    lastUpdate: '2024-01-18',
    contactPerson: 'Emily Richardson',
    priority: 'Innovation',
    relationship: 'Teknoloji ortağı'
  },
  {
    id: 605,
    customer: 'Elite Healthcare Systems',
    eventName: 'Elite Medical Conference',
    amount: 38000.00,
    currency: 'EUR',
    status: 'favorite-quote',
    statusText: 'Favori - Elite Sistem',
    tags: ['FRANSA', 'LYON', 'ELITE'],
    lastUpdate: '2024-01-17',
    contactPerson: 'Marie Dubois',
    priority: 'Elite',
    relationship: 'Prestijli müşteri'
  },
  {
    id: 606,
    customer: 'Growth Partners LLC',
    eventName: 'Business Growth Summit',
    amount: 31000.00,
    currency: 'USD',
    status: 'favorite-design',
    statusText: 'Favori - Büyüme Ortağı',
    tags: ['ABD', 'SEATTLE', 'GROWTH'],
    lastUpdate: '2024-01-16',
    contactPerson: 'David Kim',
    priority: 'Growth',
    relationship: 'Büyüme ortağı'
  },
  {
    id: 607,
    customer: 'Excellence Group',
    eventName: 'Quality Excellence Fair',
    amount: 26000.00,
    currency: 'EUR',
    status: 'favorite-active',
    statusText: 'Favori - Kalite Odaklı',
    tags: ['ALMANYA', 'KÖLN', 'QUALITY'],
    lastUpdate: '2024-01-15',
    contactPerson: 'Ingrid Schmidt',
    priority: 'Quality',
    relationship: 'Kalite standardı referansı'
  },
  {
    id: 608,
    customer: 'Future Vision Corp.',
    eventName: 'Visionary Tech Conference',
    amount: 47000.00,
    currency: 'USD',
    status: 'favorite-negotiation',
    statusText: 'Favori - Vizyon Sahibi',
    tags: ['ABD', 'AUSTIN', 'VISION'],
    lastUpdate: '2024-01-14',
    contactPerson: 'Rachel Green',
    priority: 'Visionary',
    relationship: 'Gelecek odaklı işbirliği'
  },
  {
    id: 609,
    customer: 'Reliable Systems Ltd.',
    eventName: 'System Reliability Expo',
    amount: 33000.00,
    currency: 'EUR',
    status: 'favorite-pending',
    statusText: 'Favori - Güvenilir Sistem',
    tags: ['HOLLANDA', 'ROTTERDAM', 'RELIABLE'],
    lastUpdate: '2024-01-13',
    contactPerson: 'Peter van Dijk',
    priority: 'Reliable',
    relationship: 'Güvenilir ortak'
  },
  {
    id: 610,
    customer: 'Success Stories Inc.',
    eventName: 'Success Celebration Event',
    amount: 29500.00,
    currency: 'USD',
    status: 'favorite-active',
    statusText: 'Favori - Başarı Hikayesi',
    tags: ['KANADA', 'VANCOUVER', 'SUCCESS'],
    lastUpdate: '2024-01-12',
    contactPerson: 'Catherine Lee',
    priority: 'Success',
    relationship: 'Başarı hikayesi müşterisi'
  }
];

// All opportunities (combination of all types)
export const allOpportunities = [
  ...openOpportunities,
  ...wonOpportunities, 
  ...lostOpportunities,
  ...favoriteOpportunities
];