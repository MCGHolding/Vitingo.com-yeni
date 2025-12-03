import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllInvoicesPage from '../../components/Accounting/AllInvoicesPage';

const InvoiceListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleNewInvoice = () => {
    navigate(`/${tenantSlug}/faturalar/yeni`);
  };

  const handleEditInvoice = (invoice) => {
    navigate(`/${tenantSlug}/faturalar/${invoice.id}/duzenle`);
  };

  return (
    <AllInvoicesPage
      onBackToDashboard={handleBackToDashboard}
      onNewInvoice={handleNewInvoice}
      onEditInvoice={handleEditInvoice}
    />
  );
};

export default InvoiceListPage;
