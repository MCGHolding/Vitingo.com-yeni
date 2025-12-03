import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import PaidInvoicesPageComponent from '../../components/Accounting/PaidInvoicesPage';

const PaidInvoicesPage = () => {
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
    <PaidInvoicesPageComponent
      onBackToDashboard={handleBackToDashboard}
      onNewInvoice={handleNewInvoice}
      onEditInvoice={handleEditInvoice}
    />
  );
};

export default PaidInvoicesPage;
