import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import PendingCollectionPageComponent from '../../components/Accounting/PendingCollectionPage';

const PendingCollectionPage = () => {
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
    <PendingCollectionPageComponent
      onBackToDashboard={handleBackToDashboard}
      onNewInvoice={handleNewInvoice}
      onEditInvoice={handleEditInvoice}
    />
  );
};

export default PendingCollectionPage;
