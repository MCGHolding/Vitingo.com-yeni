import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import EditCustomerPage from '../../components/Customers/EditCustomerPage';

const CustomerEditPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug, customerId } = useParams();
  const { tenant } = useTenant();
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend URL - Always use env variable, ignore window.ENV override
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                    'https://invoiceflow-55.preview.emergentagent.com';

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
    navigate(`/${tenantSlug}/musteriler/${customerId}`);
  };

  const handleSave = async (updatedCustomer) => {
    try {
      const response = await fetch(`${backendUrl}/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCustomer)
      });

      if (response.ok) {
        // Başarılı kayıt sonrası detay sayfasına dön
        navigate(`/${tenantSlug}/musteriler/${customerId}`);
      } else {
        const errorData = await response.json();
        alert('Müşteri güncellenirken hata oluştu: ' + (errorData.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Müşteri güncellenirken hata oluştu: ' + error.message);
    }
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
          <button
            onClick={() => navigate(`/${tenantSlug}/musteriler`)}
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
    <EditCustomerPage
      customer={customer}
      onBack={handleBack}
      onSave={handleSave}
    />
  );
};

export default CustomerEditPageWrapper;
