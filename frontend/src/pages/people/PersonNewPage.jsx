import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewPersonFormPage from '../../components/Customers/NewPersonFormPage';

const PersonNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  // Backend URL
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    'https://saas-migration.preview.emergentagent.com';

  const handleSave = async (personData) => {
    try {
      const response = await fetch(`${backendUrl}/api/people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personData)
      });

      if (response.ok) {
        const newPerson = await response.json();
        console.log('✅ Person saved:', newPerson);
        navigate(`/${tenantSlug}/kisiler`);
      } else {
        const errorData = await response.json();
        alert('Kişi kaydedilirken hata oluştu: ' + (errorData.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Kişi kaydedilirken hata oluştu: ' + error.message);
    }
  };

  const handleClose = () => {
    navigate(`/${tenantSlug}/kisiler`);
  };

  return (
    <NewPersonFormPage
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default PersonNewPage;
