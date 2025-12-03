import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllBanksPage from '../../components/Accounting/AllBanksPage';

const BankManagementSettingsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  const handleNewBank = () => {
    navigate(`/${tenantSlug}/bankalar/yeni`);
  };

  const handleEditBank = (bank) => {
    navigate(`/${tenantSlug}/bankalar/${bank.id}/duzenle`);
  };

  return (
    <AllBanksPage
      onBackToDashboard={handleBackToDashboard}
      onNewBank={handleNewBank}
      onEditBank={handleEditBank}
    />
  );
};

export default BankManagementSettingsPage;
