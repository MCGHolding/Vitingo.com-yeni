import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import PastFairsPageNew from '../../components/Fairs/PastFairsPageNew';

const PastFairsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <PastFairsPageNew
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default PastFairsPage;
