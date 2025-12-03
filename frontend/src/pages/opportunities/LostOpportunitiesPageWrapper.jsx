import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import LostOpportunitiesPageComponent from '../../components/Opportunities/LostOpportunitiesPage';

const LostOpportunitiesPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <LostOpportunitiesPageComponent
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default LostOpportunitiesPageWrapper;
