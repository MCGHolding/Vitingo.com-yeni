import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllCustomersPage from '../../components/Customers/AllCustomersPage';

const CustomerListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend URL
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    'https://banktrans.preview.emergentagent.com';

  // Müşterileri yükle
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation handlers
  const handleViewCustomer = (customer) => {
    navigate(`/${tenantSlug}/musteriler/${customer.id}`);
  };

  const handleEditCustomer = (customer) => {
    navigate(`/${tenantSlug}/musteriler/${customer.id}/duzenle`);
  };

  const handleNewCustomer = () => {
    navigate(`/${tenantSlug}/musteriler/yeni`);
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
