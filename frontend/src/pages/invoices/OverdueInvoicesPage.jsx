import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import OverdueInvoicesPageComponent from '../../components/Accounting/OverdueInvoicesPage';

const OverdueInvoicesPage = () => {
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
    <OverdueInvoicesPageComponent
      onBackToDashboard={handleBackToDashboard}
      onNewInvoice={handleNewInvoice}
      onEditInvoice={handleEditInvoice}
    />
  );
};

export default OverdueInvoicesPage;
