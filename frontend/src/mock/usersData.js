// Mock user data for development
export const mockUsers = [
  {
    id: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@vitingo.com',
    username: 'admu',
    phone: '+90 532 123 45 67',
    birthDate: '1990-01-15',
    department: 'senior-management',
    status: 'active',
    role: 'admin',
    createdAt: new Date('2024-01-01').toISOString(),
    lastLogin: new Date('2024-12-15').toISOString()
  },
  {
    id: 2,
    firstName: 'Mehmet',
    lastName: 'Yılmaz',
    email: 'mehmet.yilmaz@vitingo.com',
    username: 'mehy',
    phone: '+90 555 234 56 78',
    birthDate: '1988-03-22',
    department: 'sales',
    status: 'active',
    role: 'user',
    createdAt: new Date('2024-01-15').toISOString(),
    lastLogin: new Date('2024-12-14').toISOString()
  },
  {
    id: 3,
    firstName: 'Ayşe',
    lastName: 'Kaya',
    email: 'ayse.kaya@vitingo.com',
    username: 'aysk',
    phone: '+90 533 345 67 89',
    birthDate: '1992-07-08',
    department: 'customer-service',
    status: 'active',
    role: 'user',
    createdAt: new Date('2024-02-01').toISOString(),
    lastLogin: new Date('2024-12-13').toISOString()
  },
  {
    id: 4,
    firstName: 'Can',
    lastName: 'Demir',
    email: 'can.demir@vitingo.com',
    username: 'cand',
    phone: '+90 534 456 78 90',
    birthDate: '1985-11-30',
    department: 'accounting',
    status: 'inactive',
    role: 'user',
    createdAt: new Date('2024-02-15').toISOString(),
    lastLogin: new Date('2024-11-20').toISOString()
  },
  {
    id: 5,
    firstName: 'Zeynep',
    lastName: 'Özkan',
    email: 'zeynep.ozkan@vitingo.com',
    username: 'zeyo',
    phone: '+90 535 567 89 01',
    birthDate: '1990-05-14',
    department: 'marketing',
    status: 'active',
    role: 'user',
    createdAt: new Date('2024-03-01').toISOString(),
    lastLogin: new Date('2024-12-15').toISOString()
  },
  {
    id: 6,
    firstName: 'Emre',
    lastName: 'Çelik',
    email: 'emre.celik@vitingo.com',
    username: 'emrc',
    phone: '+90 536 678 90 12',
    birthDate: '1987-09-25',
    department: 'design',
    status: 'former',
    role: 'user',
    createdAt: new Date('2023-06-01').toISOString(),
    lastLogin: new Date('2024-08-15').toISOString()
  },
  {
    id: 7,
    firstName: 'Selin',
    lastName: 'Arslan',
    email: 'selin.arslan@vitingo.com',
    username: 'sela',
    phone: '+90 537 789 01 23',
    birthDate: '1993-12-03',
    department: 'management',
    status: 'active',
    role: 'user',
    createdAt: new Date('2024-03-15').toISOString(),
    lastLogin: new Date('2024-12-14').toISOString()
  },
  {
    id: 8,
    firstName: 'Burak',
    lastName: 'Şahin',
    email: 'burak.sahin@vitingo.com',
    username: 'burs',
    phone: '+90 538 890 12 34',
    birthDate: '1986-04-18',
    department: 'sales',
    status: 'inactive',
    role: 'user',
    createdAt: new Date('2024-04-01').toISOString(),
    lastLogin: new Date('2024-10-25').toISOString()
  }
];

// Helper functions for filtering users
export const getActiveUsers = () => mockUsers.filter(user => user.status === 'active');
export const getInactiveUsers = () => mockUsers.filter(user => user.status === 'inactive');
export const getFormerUsers = () => mockUsers.filter(user => user.status === 'former');
export const getAllUsers = () => mockUsers;