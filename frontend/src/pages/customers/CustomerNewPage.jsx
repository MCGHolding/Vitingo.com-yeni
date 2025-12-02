import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewCustomerForm from '../../components/Customers/NewCustomerForm';

const CustomerNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  // Backend URL
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    'https://banktrans.preview.emergentagent.com';

  const handleSave = async (customerData) => {
    try {
      const response = await fetch(`${backendUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        const newCustomer = await response.json();
        // Başarılı kayıt sonrası müşteri detay sayfasına git
        navigate(`/${tenantSlug}/musteriler/${newCustomer.id}`);
      } else {
        const errorData = await response.json();
        alert('Müşteri kaydedilirken hata oluştu: ' + (errorData.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Müşteri kaydedilirken hata oluştu: ' + error.message);
    }
  };

  const handleClose = () => {
    navigate(`/${tenantSlug}/musteriler`);
  };

  return (
    <div className="p-6">
      <NewCustomerForm
        onSave={handleSave}
        onClose={handleClose}
        refreshCustomers={() => {}}
      />
    </div>
  );
};

export default CustomerNewPage;
