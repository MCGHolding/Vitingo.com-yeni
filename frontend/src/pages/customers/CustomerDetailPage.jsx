import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ViewCustomerPage from '../../components/Customers/ViewCustomerPage';

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { tenantSlug, customerId } = useParams();
  const { tenant } = useTenant();
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend URL
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    'https://banktrans.preview.emergentagent.com';

  // Müşteri detayını yükle
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/api/customers/${customerId}`);
        if (response.ok) {
          const data = await response.json();
          setCustomer(data);
        } else if (response.status === 404) {
          setError('Müşteri bulunamadı');
        } else {
          setError('Müşteri yüklenirken hata oluştu');
        }
      } catch (error) {
        console.error('Error loading customer:', error);
        setError('Müşteri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadCustomer();
    }
  }, [customerId, backendUrl]);

  // Navigation handlers
  const handleBack = () => {
    navigate(`/${tenantSlug}/musteriler`);
  };

  const handleEdit = (customer) => {
    navigate(`/${tenantSlug}/musteriler/${customer.id}/duzenle`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Müşteri yüklen iyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">ID: {customerId}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Müşteri Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <ViewCustomerPage
      customer={customer}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
};

export default CustomerDetailPage;
