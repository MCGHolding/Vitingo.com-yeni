import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewCustomerForm from '../../components/Customers/NewCustomerForm';

const CustomerNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  // Backend URL - Always use env variable, ignore window.ENV override
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                    'https://bank-router.preview.emergentagent.com';

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
