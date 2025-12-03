import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewInvoiceForm from '../../components/Accounting/NewInvoiceForm';

const InvoiceNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}/faturalar`);
  };

  const handleNewCustomer = () => {
    navigate(`/${tenantSlug}/musteriler/yeni`);
  };

  return (
    <NewInvoiceForm
      onBackToDashboard={handleBackToDashboard}
      onNewCustomer={handleNewCustomer}
    />
  );
};

export default InvoiceNewPage;
