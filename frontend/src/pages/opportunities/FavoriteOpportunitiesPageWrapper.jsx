import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import FavoriteOpportunitiesPageComponent from '../../components/Opportunities/FavoriteOpportunitiesPage';

const FavoriteOpportunitiesPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <FavoriteOpportunitiesPageComponent
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default FavoriteOpportunitiesPageWrapper;
