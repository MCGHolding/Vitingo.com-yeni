import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Sidebar from './components/Dashboard/Sidebar';
import StatCard from './components/Dashboard/StatCard';
import RevenueChart from './components/Dashboard/RevenueChart';
import CustomerSegmentChart from './components/Dashboard/CustomerSegmentChart';
import ActivityFeed from './components/Dashboard/ActivityFeed';
import SalesFunnelChart from './components/Dashboard/SalesFunnelChart';
import TopPerformersTable from './components/Dashboard/TopPerformersTable';
import NewOpportunityForm from './components/Opportunities/NewOpportunityForm';
import OpenOpportunitiesPage from './components/Opportunities/OpenOpportunitiesPage';
import WonOpportunitiesPage from './components/Opportunities/WonOpportunitiesPage';
import LostOpportunitiesPage from './components/Opportunities/LostOpportunitiesPage';
import FavoriteOpportunitiesPage from './components/Opportunities/FavoriteOpportunitiesPage';
import AllOpportunitiesPage from './components/Opportunities/AllOpportunitiesPage';
import NewCustomerForm from './components/Customers/NewCustomerForm';
import NewPersonForm from './components/Customers/NewPersonForm';
import AllPeoplePage from './components/Customers/AllPeoplePage';
import AllCustomersPage from './components/Customers/AllCustomersPage';
import InactiveCustomersPage from './components/Customers/InactiveCustomersPage';
import FavoriteCustomersPage from './components/Customers/FavoriteCustomersPage';
import UserManagementModal from './components/UserManagement/UserManagementModal';
import AllUsersPage from './components/UserManagement/AllUsersPage';
import { customerStats, salesData } from './mock/data';
import { openOpportunities } from './mock/opportunitiesData';
import { mockUsers } from './mock/usersData';
import { allCustomers } from './mock/customersData';
import { allPeople } from './mock/peopleData';
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
  const [users, setUsers] = useState(mockUsers);
  const [customers, setCustomers] = useState(allCustomers);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [people, setPeople] = useState(allPeople);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewOpportunity = () => {
    setShowNewOpportunityForm(true);
  };

  const handleOpenOpportunities = () => {
    setCurrentView('open-opportunities');
  };

  const handleWonOpportunities = () => {
    setCurrentView('won-opportunities');
  };

  const handleLostOpportunities = () => {
    setCurrentView('lost-opportunities');
  };

  const handleFavoriteOpportunities = () => {
    setCurrentView('favorite-opportunities');
  };

  const handleAllOpportunities = () => {
    setCurrentView('all-opportunities');
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

  // Prospect Management Handlers
  const handleNewProspect = () => {
    console.log('New Prospect clicked');
    // TODO: Implement new prospect modal/form
  };

  const handleAllProspects = () => {
    console.log('All Prospects clicked');
    // TODO: Implement all prospects page view
  };

  // Quote Management Handlers
  const handleNewQuote = () => {
    console.log('New Quote clicked');
    // TODO: Implement new quote modal/form
  };

  // Customer Management Handlers
  const handleNewCustomer = () => {
    setShowNewCustomerForm(true);
  };

  const handleAllCustomers = () => {
    setCurrentView('all-customers');
  };

  const handleInactiveCustomers = () => {
    setCurrentView('inactive-customers');
  };

  const handleFavoriteCustomers = () => {
    setCurrentView('favorite-customers');
  };

  const closeCustomerForm = () => {
    setShowNewCustomerForm(false);
  };

  const saveCustomer = (customerData) => {
    const newCustomer = {
      ...customerData,
      id: Date.now()
    };
    setCustomers(prev => [newCustomer, ...prev]);
    console.log('New customer created:', newCustomer);
  };

  // People Management Handlers
  const handleNewPerson = () => {
    setShowNewPersonForm(true);
  };

  const handleAllPeople = () => {
    setCurrentView('all-people');
  };

  const closePersonForm = () => {
    setShowNewPersonForm(false);
  };

  const savePerson = (personData) => {
    const newPerson = {
      ...personData,
      id: Date.now()
    };
    console.log('Before update - People count:', people.length);
    setPeople(prev => {
      const updated = [newPerson, ...prev];
      console.log('After update - People count:', updated.length);
      console.log('New person data:', newPerson);
      return updated;
    });
  };

  const handleAllQuotes = () => {
    console.log('All Quotes clicked');
    // TODO: Implement all quotes page view
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

  const updateUser = (updatedUser) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    console.log('User updated:', updatedUser);
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
      case 'won-opportunities':
        return <WonOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'lost-opportunities':
        return <LostOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'favorite-opportunities':
        return <FavoriteOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'all-opportunities':
        return <AllOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'all-customers':
        return <AllCustomersPage onBackToDashboard={handleBackToDashboard} />;
      case 'inactive-customers':
        return <InactiveCustomersPage onBackToDashboard={handleBackToDashboard} />;
      case 'favorite-customers':
        return <FavoriteCustomersPage onBackToDashboard={handleBackToDashboard} />;
      case 'all-people':
        return (
          <AllPeoplePage 
            onBackToDashboard={handleBackToDashboard} 
            people={people}
            onUpdatePerson={(updatedPerson) => {
              setPeople(prev => prev.map(p => 
                p.id === updatedPerson.id ? updatedPerson : p
              ));
            }}
          />
        );
      case 'all-users':
        return (
          <AllUsersPage 
            users={users}
            onBack={handleBackToDashboard}
            onUpdateUser={updateUser}
          />
        );
      case 'inactive-users':
        return (
          <AllUsersPage 
            users={users.filter(user => user.status === 'inactive')}
            onBack={handleBackToDashboard}
            onUpdateUser={updateUser}
          />
        );
      case 'former-users':
        return (
          <AllUsersPage 
            users={users.filter(user => user.status === 'former')}
            onBack={handleBackToDashboard}
            onUpdateUser={updateUser}
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
        onWonOpportunities={handleWonOpportunities}
        onLostOpportunities={handleLostOpportunities}
        onFavoriteOpportunities={handleFavoriteOpportunities}
        onAllOpportunities={handleAllOpportunities}
        onNewCustomer={handleNewCustomer}
        onAllCustomers={handleAllCustomers}
        onInactiveCustomers={handleInactiveCustomers}
        onFavoriteCustomers={handleFavoriteCustomers}
        onNewPerson={handleNewPerson}
        onAllPeople={handleAllPeople}
        onNewUser={handleNewUser}
        onAllUsers={handleAllUsers}
        onInactiveUsers={handleInactiveUsers}
        onFormerUsers={handleFormerUsers}
        onNewProspect={handleNewProspect}
        onAllProspects={handleAllProspects}
        onNewQuote={handleNewQuote}
        onAllQuotes={handleAllQuotes}
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
      {/* New Customer Form Modal */}
      {showNewCustomerForm && (
        <NewCustomerForm
          onClose={closeCustomerForm}
          onSave={saveCustomer}
        />
      )}

      {/* New Person Form Modal */}
      {showNewPersonForm && (
        <NewPersonForm
          onClose={closePersonForm}
          onSave={savePerson}
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
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;