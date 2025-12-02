import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import OngoingProjectsPageComponent from '../../components/Projects/OngoingProjectsPage';

const OngoingProjectsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <OngoingProjectsPageComponent
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default OngoingProjectsPage;
