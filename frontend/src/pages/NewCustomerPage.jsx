import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewCustomerForm from "../components/Customers/NewCustomerForm";

const NewCustomerPage = () => {
  const navigate = useNavigate();

  const handleSaveCustomer = async (customerData) => {
    try {
      // Try runtime config first, fallback to environment variables
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        'https://vitingo-admin.preview.emergentagent.com';
                        
      console.log('Saving customer to:', backendUrl);
      const response = await fetch(`${backendUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        const newCustomer = await response.json();
        console.log('New customer created:', newCustomer);
        
        // Navigate back to customers page or dashboard (success modal handled by form)
        navigate('/');
      } else {
        const errorData = await response.json();
        console.error('Failed to save customer:', errorData);
        alert('Müşteri kaydedilirken hata oluştu: ' + (errorData.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Müşteri kaydedilirken hata oluştu: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Yeni Müşteri Formu</h2>
      <NewCustomerForm onSave={handleSaveCustomer} />
    </div>
  );
};

export default NewCustomerPage;