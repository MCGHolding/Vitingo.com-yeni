import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllSuppliersPage from '../../components/Suppliers/AllSuppliersPage';

const SupplierListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleNewSupplier = () => {
    navigate(`/${tenantSlug}/tedarikciler/yeni`);
  };

  return (
    <AllSuppliersPage
      onBackToDashboard={handleBackToDashboard}
      onNewSupplier={handleNewSupplier}
    />
  );
};

export default SupplierListPage;
