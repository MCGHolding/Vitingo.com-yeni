import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewBankForm from '../../components/Accounting/NewBankForm';

const BankNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}/bankalar`);
  };

  const handleGoToBanks = () => {
    navigate(`/${tenantSlug}/bankalar`);
  };

  return (
    <NewBankForm
      onBackToDashboard={handleBackToDashboard}
      onGoToBanks={handleGoToBanks}
    />
  );
};

export default BankNewPage;
