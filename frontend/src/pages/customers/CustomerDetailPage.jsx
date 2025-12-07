import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ViewCustomerPage from '../../components/Customers/ViewCustomerPage';
import apiClient from '../../utils/apiClient';

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { tenantSlug, customerId } = useParams();
  const { tenant } = useTenant();
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Müşteri detayını yükle
  useEffect(() => {
    const loadCustomer = async () => {
      // Reserved paths kontrolü
      const reservedPaths = ['yeni', 'pasif', 'favoriler', 'adaylar', 'duzenle'];
      if (reservedPaths.includes(customerId)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading customer:', customerId);
        
        const data = await apiClient.getCustomer(customerId);
        console.log('✅ Customer loaded:', data);
        setCustomer(data);
      } catch (error) {
        console.error('❌ Fetch error:', error);
        if (error.message.includes('404')) {
          setError('Müşteri bulunamadı');
        } else {
          setError('Müşteri yüklenirken hata oluştu: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  // Navigation handlers
  const handleBack = () => {
    navigate(`/${tenantSlug}/musteriler`);
  };

  const handleEdit = (customerData) => {
    // customerData objesi veya sadece customer state'i kullanılabilir
    const id = customerData?.id || customer?.id || customerId;
    navigate(`/${tenantSlug}/musteriler/${id}/duzenle`);
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">Müşteri ID: {customerId}</p>
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

  // No customer state
  if (!customer) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Müşteri bilgisi bulunamadı.</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Müşteri Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  // ESKİ ViewCustomerPage component'ini kullan - TÜM ÖZELLİKLERİYLE
  return (
    <ViewCustomerPage
      customer={customer}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
};

export default CustomerDetailPage;
