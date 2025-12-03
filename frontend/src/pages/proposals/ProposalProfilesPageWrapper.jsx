import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ProposalProfilesPage from './ProposalProfilesPage';

const ProposalProfilesPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <ProposalProfilesPage
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default ProposalProfilesPageWrapper;
