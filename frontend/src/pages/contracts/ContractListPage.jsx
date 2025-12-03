import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import ContractsPage from '../../components/Contracts/ContractsPage';

const ContractListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const { user } = useAuth();

  const handleBack = () => {
    navigate(`/${tenantSlug}`);
  };

  const setCurrentView = (view) => {
    if (view === 'contracts-new') {
      navigate(`/${tenantSlug}/sozlesmeler/yeni`);
    }
  };

  return (
    <ContractsPage
      onBack={handleBack}
      user={user}
      setCurrentView={setCurrentView}
    />
  );
};

export default ContractListPage;
