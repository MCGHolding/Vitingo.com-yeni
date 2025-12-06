import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import EditInvoiceForm from '../../components/Accounting/EditInvoiceForm';

const InvoiceEditPage = () => {
  const navigate = useNavigate();
  const { tenantSlug, invoiceId } = useParams();
  const { tenant } = useTenant();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    'https://bank-manager-4.preview.emergentagent.com';

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/api/invoices/${invoiceId}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId, backendUrl]);

  const handleBackToAllInvoices = () => {
    navigate(`/${tenantSlug}/faturalar`);
  };

  const handleSaveSuccess = () => {
    navigate(`/${tenantSlug}/faturalar`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <EditInvoiceForm
      invoice={invoice}
      onBackToAllInvoices={handleBackToAllInvoices}
      onSaveSuccess={handleSaveSuccess}
    />
  );
};

export default InvoiceEditPage;
