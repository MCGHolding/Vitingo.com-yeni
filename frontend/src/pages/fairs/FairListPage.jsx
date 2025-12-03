import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllFairsPage from '../../components/Fairs/AllFairsPageNew';

const FairListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <AllFairsPage
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default FairListPage;
