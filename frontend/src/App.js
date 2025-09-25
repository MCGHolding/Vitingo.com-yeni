import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Dashboard/Sidebar';
import StatCard from './components/Dashboard/StatCard';
import RevenueChart from './components/Dashboard/RevenueChart';
import CustomerSegmentChart from './components/Dashboard/CustomerSegmentChart';
import ActivityFeed from './components/Dashboard/ActivityFeed';
import SalesFunnelChart from './components/Dashboard/SalesFunnelChart';
import TopPerformersTable from './components/Dashboard/TopPerformersTable';
import NewOpportunityForm from './components/Opportunities/NewOpportunityForm';
import OpenOpportunitiesPage from './components/Opportunities/OpenOpportunitiesPage';
import UserManagementModal from './components/UserManagement/UserManagementModal';
import AllUsersPage from './components/UserManagement/AllUsersPage';
import { customerStats, salesData } from './mock/data';
import { openOpportunities } from './mock/opportunitiesData';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Menu,
  X
} from 'lucide-react';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewOpportunityForm, setShowNewOpportunityForm] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [opportunities, setOpportunities] = useState(openOpportunities);
  const [users, setUsers] = useState([
    {
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@vitingo.com',
      username: 'admu',
      phone: '+90 532 123 45 67',
      department: 'senior-management',
      status: 'active',
      createdAt: new Date('2024-01-01').toISOString()
    }
  ]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewOpportunity = () => {
    setShowNewOpportunityForm(true);
  };

  const handleOpenOpportunities = () => {
    setCurrentView('open-opportunities');
  };

  // User Management Handlers
  const handleNewUser = () => {
    setShowUserManagementModal(true);
  };

  const handleAllUsers = () => {
    setCurrentView('all-users');
  };

  const handleInactiveUsers = () => {
    setCurrentView('inactive-users');
  };

  const handleFormerUsers = () => {
    setCurrentView('former-users');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const closeOpportunityForm = () => {
    setShowNewOpportunityForm(false);
  };

  const closeUserManagementModal = () => {
    setShowUserManagementModal(false);
  };

  const saveUser = (userData) => {
    const newUser = {
      ...userData,
      id: Date.now(),
      status: 'active' // New users are active by default
    };
    setUsers(prev => [newUser, ...prev]);
    console.log('New user created:', newUser);
  };

  const saveOpportunity = (formData) => {
    // Generate new ID (get highest existing ID + 1)
    const maxId = Math.max(...opportunities.map(op => op.id));
    const newId = maxId + 1;

    // Create tags array from form data
    const tags = [];
    if (formData.country) {
      const countryMap = {
        'tr': 'TÜRKİYE',
        'de': 'ALMANYA',
        'us': 'ABD',
        'gb': 'İNGİLTERE',
        'fr': 'FRANSA'
      };
      if (countryMap[formData.country]) {
        tags.push(countryMap[formData.country]);
      }
    }

    if (formData.city) {
      const cityMap = {
        'istanbul': 'İSTANBUL',
        'frankfurt': 'FRANKFURT',
        'munich': 'MÜNİH',
        'cologne': 'KÖLN',
        'dusseldorf': 'DÜSSELDORF'
      };
      if (cityMap[formData.city]) {
        tags.push(cityMap[formData.city]);
      }
    }

    if (formData.tradeShowName) {
      tags.push(formData.tradeShowName.toUpperCase());
    }

    // Create new opportunity object
    const newOpportunity = {
      id: newId,
      customer: formData.customer,
      eventName: formData.subject || formData.tradeShowName || 'Yeni Etkinlik',
      amount: parseFloat(formData.amount) || 0,
      currency: formData.currency,
      status: formData.status || 'open-active',
      statusText: `Açık - Aktif - ${formData.stage === 'lead' ? 'Yeni Fırsat' : 
                   formData.stage === 'qualified' ? 'Nitelikli Fırsat' :
                   formData.stage === 'proposal' ? 'Teklif Bekleniyor' :
                   formData.stage === 'negotiation' ? 'Müzakere' : 'Değerlendiriliyor'}`,
      tags: tags,
      lastUpdate: new Date().toISOString().split('T')[0],
      contactPerson: formData.contactPerson || 'Belirtilmemiş'
    };

    // Add to opportunities list
    setOpportunities(prev => [newOpportunity, ...prev]);
    
    console.log('New opportunity saved:', newOpportunity);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'open-opportunities':
        return <OpenOpportunitiesPage onBackToDashboard={handleBackToDashboard} opportunities={opportunities} />;
      case 'all-users':
        return (
          <AllUsersPage 
            users={users}
            onBack={handleBackToDashboard}
            onEditUser={(user) => console.log('Edit user:', user)}
            onViewUser={(user) => console.log('View user:', user)}
          />
        );
      case 'inactive-users':
        return (
          <AllUsersPage 
            users={users.filter(user => user.status === 'inactive')}
            onBack={handleBackToDashboard}
            onEditUser={(user) => console.log('Edit user:', user)}
            onViewUser={(user) => console.log('View user:', user)}
          />
        );
      case 'former-users':
        return (
          <AllUsersPage 
            users={users.filter(user => user.status === 'former')}
            onBack={handleBackToDashboard}
            onEditUser={(user) => console.log('Edit user:', user)}
            onViewUser={(user) => console.log('View user:', user)}
          />
        );
      default:
        return (
          <>
            {/* Top bar */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={toggleSidebar}
                  >
                    {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-600">CRM sistemine hoş geldiniz</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Bugün</p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleDateString('tr-TR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-4 lg:p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Toplam Müşteri"
                  value={customerStats.totalCustomers.toLocaleString('tr-TR')}
                  change={`+${customerStats.newThisMonth}`}
                  changeType="positive"
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Aktif Müşteri"
                  value={customerStats.activeCustomers.toLocaleString('tr-TR')}
                  change={`${customerStats.churnRate}% kayıp`}
                  changeType="negative"
                  icon={Target}
                  color="green"
                />
                <StatCard
                  title="Toplam Gelir"
                  value={`₺${salesData.totalRevenue.toLocaleString('tr-TR')}`}
                  change={`%${salesData.monthlyGrowth}`}
                  changeType="positive"
                  icon={DollarSign}
                  color="purple"
                />
                <StatCard
                  title="Dönüşüm Oranı"
                  value={`%${salesData.conversionRate}`}
                  change={`Ort. ₺${salesData.avgDealSize.toLocaleString('tr-TR')}`}
                  changeType="positive"
                  icon={TrendingUp}
                  color="orange"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RevenueChart />
                <CustomerSegmentChart />
              </div>

              {/* Second Row Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <SalesFunnelChart />
                <ActivityFeed />
              </div>

              {/* Performance Table */}
              <div className="mb-8">
                <TopPerformersTable />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        onNewOpportunity={handleNewOpportunity}
        onOpenOpportunities={handleOpenOpportunities}
        onNewUser={handleNewUser}
        onAllUsers={handleAllUsers}
        onInactiveUsers={handleInactiveUsers}
        onFormerUsers={handleFormerUsers}
      />
      
      {/* Main content */}
      <div className="lg:ml-64">
        {renderContent()}
      </div>

      {/* New Opportunity Form Modal */}
      {showNewOpportunityForm && (
        <NewOpportunityForm
          onClose={closeOpportunityForm}
          onSave={saveOpportunity}
        />
      )}
      {/* User Management Modal */}
      {showUserManagementModal && (
        <UserManagementModal
          onClose={closeUserManagementModal}
          onSave={saveUser}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;