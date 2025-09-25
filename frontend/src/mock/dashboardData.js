// Modern Dashboard Mock Data

// KPI Stats
export const kpiStats = {
  totalSales: 2847500,
  totalProfit: 847200,
  growthRate: 23.8,
  totalCustomers: 1247,
  activeLeads: 89,
  inactiveLeads: 23,
  lostLeads: 15,
  totalReceivables: 1234567,
  overdueReceivables: 234567,
  paidReceivables: 987654,
  newCustomers: 42,
  activeCustomers: 892,
  inactiveCustomers: 145,
  lostCustomers: 87,
  csat: 87.5
};

// Sales by Country
export const salesByCountry = [
  { country: 'Türkiye', sales: 1847500, percentage: 65, flag: '🇹🇷' },
  { country: 'Almanya', sales: 425600, percentage: 15, flag: '🇩🇪' },
  { country: 'Fransa', sales: 284750, percentage: 10, flag: '🇫🇷' },
  { country: 'İtalya', sales: 171600, percentage: 6, flag: '🇮🇹' },
  { country: 'İspanya', sales: 117900, percentage: 4, flag: '🇪🇸' }
];

// Recent Transactions
export const recentTransactions = [
  {
    id: 1,
    date: '2025-01-15',
    customer: 'ABC Teknoloji Ltd.',
    amount: 45000,
    status: 'completed',
    type: 'payment',
    source: 'bank_transfer'
  },
  {
    id: 2,
    date: '2025-01-14',
    customer: 'XYZ Otomotiv A.Ş.',
    amount: 32500,
    status: 'pending',
    type: 'invoice',
    source: 'credit_card'
  },
  {
    id: 3,
    date: '2025-01-14',
    customer: 'DEF Yazılım Inc.',
    amount: 18700,
    status: 'completed',
    type: 'payment',
    source: 'online'
  },
  {
    id: 4,
    date: '2025-01-13',
    customer: 'GHI Elektronik Ltd.',
    amount: 67200,
    status: 'overdue',
    type: 'invoice',
    source: 'bank_transfer'
  },
  {
    id: 5,
    date: '2025-01-13',
    customer: 'JKL Medya A.Ş.',
    amount: 29800,
    status: 'completed',
    type: 'payment',
    source: 'cash'
  }
];

// Top 5 Customers
export const topCustomers = [
  {
    id: 1,
    name: 'ABC Teknoloji Ltd.',
    sales: 234500,
    growth: 18.5,
    status: 'vip',
    avatar: 'AT'
  },
  {
    id: 2,
    name: 'XYZ Otomotiv A.Ş.',
    sales: 198700,
    growth: 12.3,
    status: 'active',
    avatar: 'XO'
  },
  {
    id: 3,
    name: 'DEF Yazılım Inc.',
    sales: 156800,
    growth: -5.2,
    status: 'active',
    avatar: 'DY'
  },
  {
    id: 4,
    name: 'GHI Elektronik Ltd.',
    sales: 134200,
    growth: 24.7,
    status: 'premium',
    avatar: 'GE'
  },
  {
    id: 5,
    name: 'JKL Medya A.Ş.',
    sales: 98500,
    growth: 8.9,
    status: 'active',
    avatar: 'JM'
  }
];

// Monthly Revenue Data for Charts
export const monthlyRevenue = [
  { month: 'Oca', revenue: 185000, target: 200000 },
  { month: 'Şub', revenue: 220000, target: 210000 },
  { month: 'Mar', revenue: 245000, target: 220000 },
  { month: 'Nis', revenue: 198000, target: 230000 },
  { month: 'May', revenue: 267000, target: 240000 },
  { month: 'Haz', revenue: 289000, target: 250000 },
  { month: 'Tem', revenue: 312000, target: 260000 },
  { month: 'Ağu', revenue: 298000, target: 270000 },
  { month: 'Eyl', revenue: 334000, target: 280000 },
  { month: 'Eki', revenue: 356000, target: 290000 },
  { month: 'Kas', revenue: 342000, target: 300000 },
  { month: 'Ara', revenue: 378000, target: 310000 }
];

// Customer Growth Data
export const customerGrowth = [
  { month: 'Oca', newCustomers: 45, churnedCustomers: 12 },
  { month: 'Şub', newCustomers: 52, churnedCustomers: 8 },
  { month: 'Mar', newCustomers: 38, churnedCustomers: 15 },
  { month: 'Nis', newCustomers: 61, churnedCustomers: 9 },
  { month: 'May', newCustomers: 49, churnedCustomers: 11 },
  { month: 'Haz', newCustomers: 67, churnedCustomers: 6 },
  { month: 'Tem', newCustomers: 73, churnedCustomers: 13 },
  { month: 'Ağu', newCustomers: 58, churnedCustomers: 7 },
  { month: 'Eyl', newCustomers: 82, churnedCustomers: 10 },
  { month: 'Eki', newCustomers: 76, churnedCustomers: 14 },
  { month: 'Kas', newCustomers: 69, churnedCustomers: 8 },
  { month: 'Ara', newCustomers: 84, churnedCustomers: 12 }
];

// Lead Pipeline Data
export const leadPipeline = [
  { stage: 'Prospects', count: 234, value: 1234567 },
  { stage: 'Qualified', count: 156, value: 987654 },
  { stage: 'Proposal', count: 89, value: 654321 },
  { stage: 'Negotiation', count: 45, value: 432100 },
  { stage: 'Closed Won', count: 23, value: 298765 }
];

// Geographic Sales Data for Map
export const geographicSales = [
  { 
    country: 'Turkey', 
    sales: 1847500, 
    customers: 623, 
    projects: 145,
    coordinates: [35.2433, 38.9637],
    growth: 23.5
  },
  { 
    country: 'Germany', 
    sales: 425600, 
    customers: 89, 
    projects: 34,
    coordinates: [10.4515, 51.1657],
    growth: 12.8
  },
  { 
    country: 'France', 
    sales: 284750, 
    customers: 67, 
    projects: 28,
    coordinates: [2.2137, 46.2276],
    growth: 18.2
  },
  { 
    country: 'Italy', 
    sales: 171600, 
    customers: 45, 
    projects: 19,
    coordinates: [12.5674, 41.8719],
    growth: 8.7
  },
  { 
    country: 'Spain', 
    sales: 117900, 
    customers: 32, 
    projects: 12,
    coordinates: [-3.7492, 40.4637],
    growth: 15.3
  }
];

// Performance Targets
export const performanceTargets = [
  { metric: 'Satış Hedefi', current: 78, target: 100, unit: '%' },
  { metric: 'Yeni Müşteri', current: 92, target: 100, unit: '%' },
  { metric: 'Soğuk Arama Dönüşüm', current: 6.8, target: 10, unit: '%' },
  { metric: 'E-posta Dönüşüm', current: 3.2, target: 5, unit: '%' }
];

// Topic Interest Data
export const topicInterests = [
  { topic: 'AI & Machine Learning', percentage: 78, count: 234 },
  { topic: 'Cloud Computing', percentage: 65, count: 198 },
  { topic: 'Cybersecurity', percentage: 58, count: 176 },
  { topic: 'IoT Solutions', percentage: 45, count: 134 },
  { topic: 'Blockchain', percentage: 32, count: 98 },
  { topic: 'Data Analytics', percentage: 71, count: 215 }
];