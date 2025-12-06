import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllCustomersPage from '../../components/Customers/AllCustomersPage';

const CustomerListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const location = useLocation();
  const { tenant } = useTenant();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL'den filtre belirle
  const getFilterFromPath = () => {
    const path = location.pathname;
    if (path.includes('/pasif')) return 'passive';
    if (path.includes('/favoriler')) return 'favorites';
    if (path.includes('/adaylar')) return 'prospects';
    return 'all';
  };

  const currentFilter = getFilterFromPath();

  // Backend URL - Always use env variable, ignore window.ENV override
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                    'https://bank-manager-4.preview.emergentagent.com';

  // Müşterileri yükle
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/customers`);
      if (response.ok) {
        let data = await response.json();
        
        // Filtreleme uygula
        if (currentFilter === 'passive') {
          data = data.filter(c => c.status === 'passive' || c.status === 'pasif');
        } else if (currentFilter === 'favorites') {
          data = data.filter(c => c.isFavorite === true);
        } else if (currentFilter === 'prospects') {
          data = data.filter(c => c.isProspect === true || c.customerType === 'prospect');
        }
        
        setCustomers(data);
        console.log(`✅ Loaded ${data.length} customers (filter: ${currentFilter})`);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [currentFilter]); // Filter değişince yeniden yükle

  // Navigation handlers
  const handleViewCustomer = (customer) => {
    navigate(`/${tenantSlug}/musteriler/${customer.id}`);
  };

  const handleEditCustomer = (customer) => {
    navigate(`/${tenantSlug}/musteriler/${customer.id}/duzenle`);
  };

  const handleNewCustomer = (options = {}) => {
    if (options.isProspect) {
      navigate(`/${tenantSlug}/musteriler/yeni?type=prospect`);
    } else {
      navigate(`/${tenantSlug}/musteriler/yeni`);
    }
  };

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AllCustomersPage
      customers={customers}
      refreshCustomers={loadCustomers}
      onViewCustomer={handleViewCustomer}
      onEditCustomer={handleEditCustomer}
      onNewCustomer={handleNewCustomer}
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default CustomerListPage;
