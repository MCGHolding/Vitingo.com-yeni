import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import OpenOpportunitiesPageComponent from '../../components/Opportunities/OpenOpportunitiesPage';

const OpenOpportunitiesPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleEditOpportunity = (opportunity) => {
    navigate(`/${tenantSlug}/firsatlar/${opportunity.id}/duzenle`);
  };

  return (
    <OpenOpportunitiesPageComponent
      onBackToDashboard={handleBackToDashboard}
      onEditOpportunity={handleEditOpportunity}
    />
  );
};

export default OpenOpportunitiesPageWrapper;
