import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import CancelledProjectsPageComponent from '../../components/Projects/CancelledProjectsPage';

const CancelledProjectsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <CancelledProjectsPageComponent
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default CancelledProjectsPage;
