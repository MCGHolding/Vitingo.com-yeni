import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import CompletedProjectsPageComponent from '../../components/Projects/CompletedProjectsPage';

const CompletedProjectsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <CompletedProjectsPageComponent
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default CompletedProjectsPage;
