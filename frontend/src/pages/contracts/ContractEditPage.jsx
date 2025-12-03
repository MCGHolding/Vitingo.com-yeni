import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ContractCreatePage from '../../components/Settings/ContractCreatePage';

const ContractEditPage = () => {
  const navigate = useNavigate();
  const { tenantSlug, contractId } = useParams();
  const { tenant } = useTenant();

  const handleBack = () => {
    navigate(`/${tenantSlug}/sozlesmeler`);
  };

  const handleEditTemplate = (template) => {
    console.log('Edit template:', template);
  };

  return (
    <ContractCreatePage
      onBack={handleBack}
      fromContracts={true}
      contractId={contractId}
      isEdit={true}
      onEditTemplate={handleEditTemplate}
    />
  );
};

export default ContractEditPage;
