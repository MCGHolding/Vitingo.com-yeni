import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllBriefsPage from '../../components/Brief/AllBriefsPage';

const BriefListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleNewBrief = () => {
    navigate(`/${tenantSlug}/briefler/yeni`);
  };

  return (
    <AllBriefsPage
      onBackToDashboard={handleBackToDashboard}
      onNewBrief={handleNewBrief}
    />
  );
};

export default BriefListPage;
