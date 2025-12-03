import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import FutureFairsPageComponent from '../../components/Fairs/FutureFairsPage';

const FutureFairsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <FutureFairsPageComponent
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default FutureFairsPage;
