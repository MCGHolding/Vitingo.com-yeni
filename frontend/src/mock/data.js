// Mock data for Bana Vitingo CRM Dashboard

export const customerStats = {
  totalCustomers: 1247,
  activeCustomers: 892,
  newThisMonth: 89,
  churnRate: 3.2
};

export const salesData = {
  totalRevenue: 485720,
  monthlyGrowth: 12.5,
  avgDealSize: 3200,
  conversionRate: 28.4
};

export const monthlyRevenue = [
  { month: 'Oca', revenue: 35000, customers: 120 },
  { month: 'Şub', revenue: 42000, customers: 145 },
  { month: 'Mar', revenue: 38000, customers: 132 },
  { month: 'Nis', revenue: 51000, customers: 178 },
  { month: 'May', revenue: 47000, customers: 165 },
  { month: 'Haz', revenue: 59000, customers: 198 },
  { month: 'Tem', revenue: 63000, customers: 210 },
  { month: 'Ağu', revenue: 68000, customers: 225 },
  { month: 'Eyl', revenue: 72000, customers: 240 },
  { month: 'Eke', revenue: 58000, customers: 195 },
  { month: 'Kas', revenue: 65000, customers: 218 },
  { month: 'Ara', revenue: 71000, customers: 235 }
];

export const customerSegments = [
  { segment: 'Premium', value: 35, color: '#3B82F6' },
  { segment: 'Standart', value: 45, color: '#10B981' },
  { segment: 'Temel', value: 20, color: '#F59E0B' }
];

export const recentActivities = [
  {
    id: 1,
    type: 'sale',
    customer: 'Ahmet Yılmaz',
    action: 'Yeni satış tamamlandı',
    amount: 4500,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 2,
    type: 'customer',
    customer: 'Zeynep Kara',
    action: 'Yeni müşteri kaydı',
    amount: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 3,
    type: 'meeting',
    customer: 'Mehmet Demir',
    action: 'Toplantı planlandı',
    amount: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 4,
    type: 'sale',
    customer: 'Fatma Öz',
    action: 'Satış tamamlandı',
    amount: 2800,
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 5,
    type: 'follow-up',
    customer: 'Can Şen',
    action: 'Takip görüşmesi yapıldı',
    amount: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
];

export const customers = [
  {
    id: 1,
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@email.com',
    segment: 'Premium',
    lastContact: '2024-01-15',
    totalSpent: 15600,
    status: 'active'
  },
  {
    id: 2,
    name: 'Zeynep Kara',
    email: 'zeynep.kara@email.com',
    segment: 'Standart',
    lastContact: '2024-01-14',
    totalSpent: 8200,
    status: 'active'
  },
  {
    id: 3,
    name: 'Mehmet Demir',
    email: 'mehmet.demir@email.com',
    segment: 'Premium',
    lastContact: '2024-01-13',
    totalSpent: 22100,
    status: 'active'
  },
  {
    id: 4,
    name: 'Fatma Öz',
    email: 'fatma.oz@email.com',
    segment: 'Temel',
    lastContact: '2024-01-12',
    totalSpent: 3400,
    status: 'inactive'
  },
  {
    id: 5,
    name: 'Can Şen',
    email: 'can.sen@email.com',
    segment: 'Standart',
    lastContact: '2024-01-11',
    totalSpent: 11900,
    status: 'active'
  }
];

export const salesFunnel = [
  { stage: 'Potansiyel', count: 245, color: '#EF4444' },
  { stage: 'Nitelikli', count: 187, color: '#F97316' },
  { stage: 'Teklif', count: 98, color: '#EAB308' },
  { stage: 'Müzakere', count: 67, color: '#22C55E' },
  { stage: 'Kapanış', count: 34, color: '#3B82F6' }
];

export const topPerformers = [
  { name: 'Ayşe Demir', sales: 47, revenue: 156800 },
  { name: 'Mustafa Kaya', sales: 42, revenue: 142300 },
  { name: 'Elif Yıldız', sales: 39, revenue: 138900 },
  { name: 'Burak Çelik', sales: 35, revenue: 125600 },
  { name: 'Seda Arslan', sales: 31, revenue: 118200 }
];