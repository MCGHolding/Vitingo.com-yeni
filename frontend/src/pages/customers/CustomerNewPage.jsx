import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewCustomerForm from '../../components/Customers/NewCustomerForm';

const CustomerNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const [saving, setSaving] = useState(false);

  // Backend URL - Always use env variable, ignore window.ENV override
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                    'https://saas-migration.preview.emergentagent.com';

  const handleSave = async (customerData) => {
    console.log('💾 Saving customer:', customerData);
    
    try {
      setSaving(true);
      const response = await fetch(`${backendUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const newCustomer = await response.json();
        console.log('✅ Customer saved:', newCustomer);
        // Başarılı kayıt sonrası müşteri listesine git
        navigate(`/${tenantSlug}/musteriler`);
      } else {
        const errorData = await response.json();
        console.error('❌ Save error:', errorData);
        alert('Müşteri kaydedilirken hata oluştu: ' + (errorData.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      alert('Müşteri kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    navigate(`/${tenantSlug}/musteriler`);
  };

  // refreshCustomers fonksiyonu - form component'i bunu bekliyor olabilir
  const refreshCustomers = async () => {
    // Listeye dönünce otomatik yüklenecek
    console.log('🔄 Refresh customers called');
  };

  return (
    <div className="p-6">
      <NewCustomerForm
        onSave={handleSave}
        onClose={handleClose}
        refreshCustomers={refreshCustomers}
        returnToInvoice={false}
        onCustomerAdded={(id, name) => {
          console.log('✅ Customer added:', id, name);
          navigate(`/${tenantSlug}/musteriler`);
        }}
      />
    </div>
  );
};

export default CustomerNewPage;
