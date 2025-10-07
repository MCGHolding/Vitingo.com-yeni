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

// Favorite opportunities data removed - now using real API data
export const favoriteOpportunities = [];

// All opportunities (combination of all types)
export const allOpportunities = [
  ...openOpportunities,
  ...wonOpportunities, 
  ...lostOpportunities,
  ...favoriteOpportunities
];