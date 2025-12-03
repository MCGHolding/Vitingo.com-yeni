import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContractManagementPageComponent from '../../components/Settings/ContractManagementPage';

const ContractManagementPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return <ContractManagementPageComponent onBack={handleBack} />;
};

export default ContractManagementPage;
