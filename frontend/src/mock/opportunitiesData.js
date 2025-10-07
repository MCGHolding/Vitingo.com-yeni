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

// Lost opportunities data
export const lostOpportunities = [
  {
    id: 501,
    customer: 'CompetitorTech Ltd.',
    eventName: 'Industry Summit 2024',
    amount: 22000.00,
    currency: 'EUR',
    status: 'lost',
    statusText: 'Kaybedilen - Bütçe Yetersiz',
    tags: ['ALMANYA', 'FRANKFURT', 'INDUSTRY'],
    lastUpdate: '2024-01-20',
    contactPerson: 'Markus Fischer',
    lostDate: '2024-01-18',
    lostReason: 'Bütçe kısıtlamaları',
    competitor: 'RivalCorp'
  },
  {
    id: 502,
    customer: 'Budget Healthcare',
    eventName: 'Medical Equipment Fair',
    amount: 15500.00,
    currency: 'USD',
    status: 'lost',
    statusText: 'Kaybedilen - Fiyat Rekabeti',
    tags: ['ABD', 'CHICAGO', 'MEDICAL'],
    lastUpdate: '2024-01-19',
    contactPerson: 'Robert Davis',
    lostDate: '2024-01-17',
    lostReason: 'Rakip daha ucuz teklif verdi',
    competitor: 'CheapMed Inc.'
  },
  {
    id: 503,
    customer: 'Local Manufacturing',
    eventName: 'Production Expo',
    amount: 12000.00,
    currency: 'TRY',
    status: 'lost',
    statusText: 'Kaybedilen - Geç Yanıt',
    tags: ['TÜRKİYE', 'ANKARA', 'MANUFACTURING'],
    lastUpdate: '2024-01-18',
    contactPerson: 'Mehmet Aydın',
    lostDate: '2024-01-16',
    lostReason: 'Teklif süresi geçti',
    competitor: 'Hızlı Çözüm A.Ş.'
  },
  {
    id: 504,
    customer: 'Old Fashion Corp.',
    eventName: 'Traditional Methods Fair',
    amount: 8000.00,
    currency: 'EUR',
    status: 'lost',
    statusText: 'Kaybedilen - Teknoloji Uyumsuzluğu',
    tags: ['İTALYA', 'MILANO', 'TRADITIONAL'],
    lastUpdate: '2024-01-17',
    contactPerson: 'Giuseppe Rossi',
    lostDate: '2024-01-15',
    lostReason: 'Teknoloji gereksinimleri uyumsuz',
    competitor: 'ClassicTech SRL'
  },
  {
    id: 505,
    customer: 'Delayed Decisions Inc.',
    eventName: 'Business Conference',
    amount: 19000.00,
    currency: 'USD',
    status: 'lost',
    statusText: 'Kaybedilen - Karar Gecikmesi',
    tags: ['ABD', 'DENVER', 'BUSINESS'],
    lastUpdate: '2024-01-16',
    contactPerson: 'Amanda Wilson',
    lostDate: '2024-01-14',
    lostReason: 'Müşteri karar veremedi',
    competitor: 'N/A'
  },
  {
    id: 506,
    customer: 'Cheap Solutions Ltd.',
    eventName: 'Cost Reduction Summit',
    amount: 5500.00,
    currency: 'EUR',
    status: 'lost',
    statusText: 'Kaybedilen - Düşük Bütçe',
    tags: ['POLONYA', 'WARSAW', 'COST'],
    lastUpdate: '2024-01-15',
    contactPerson: 'Piotr Kowalski',
    lostDate: '2024-01-13',
    lostReason: 'Bütçe çok düşük',
    competitor: 'BudgetTech Sp. z o.o.'
  },
  {
    id: 507,
    customer: 'Indecisive Corp.',
    eventName: 'Options Conference',
    amount: 14000.00,
    currency: 'USD',
    status: 'lost',
    statusText: 'Kaybedilen - Proje İptal',
    tags: ['KANADA', 'TORONTO', 'OPTIONS'],
    lastUpdate: '2024-01-14',
    contactPerson: 'Jennifer Brown',
    lostDate: '2024-01-12',
    lostReason: 'Proje iptal edildi',
    competitor: 'N/A'
  },
  {
    id: 508,
    customer: 'Complex Requirements Inc.',
    eventName: 'Specialized Tech Fair',
    amount: 28000.00,
    currency: 'EUR',
    status: 'lost',
    statusText: 'Kaybedilen - Teknik Yetersizlik',
    tags: ['HOLLANDA', 'AMSTERDAM', 'TECH'],
    lastUpdate: '2024-01-13',
    contactPerson: 'Willem van der Berg',
    lostDate: '2024-01-11',
    lostReason: 'Teknik gereksinimler karşılanamadı',
    competitor: 'AdvancedTech B.V.'
  },
  {
    id: 509,
    customer: 'Rush Orders Corp.',
    eventName: 'Quick Delivery Expo',
    amount: 11000.00,
    currency: 'USD',
    status: 'lost',
    statusText: 'Kaybedilen - Teslimat Süresi',
    tags: ['ABD', 'ATLANTA', 'DELIVERY'],
    lastUpdate: '2024-01-12',
    contactPerson: 'Brian Miller',
    lostDate: '2024-01-10',
    lostReason: 'Teslimat süresi uygun değil',
    competitor: 'FastTrack Solutions'
  },
  {
    id: 510,
    customer: 'Conservative Industries',
    eventName: 'Traditional Business Fair',
    amount: 16500.00,
    currency: 'EUR',
    status: 'lost',
    statusText: 'Kaybedilen - Değişim Direnci',
    tags: ['AVUSTURYA', 'VIENNA', 'TRADITIONAL'],
    lastUpdate: '2024-01-11',
    contactPerson: 'Franz Schneider',
    lostDate: '2024-01-09',
    lostReason: 'Yeniliklere direnç',
    competitor: 'OldSchool GmbH'
  }
];

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