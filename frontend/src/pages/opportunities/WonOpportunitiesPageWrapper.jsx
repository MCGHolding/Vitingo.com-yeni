import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import WonOpportunitiesPageComponent from '../../components/Opportunities/WonOpportunitiesPage';

const WonOpportunitiesPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <WonOpportunitiesPageComponent
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default WonOpportunitiesPageWrapper;
