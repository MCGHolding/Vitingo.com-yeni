import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewProjectForm from '../../components/Projects/NewProjectForm';

const ProjectNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}/projeler`);
  };

  const handleClose = () => {
    navigate(`/${tenantSlug}/projeler`);
  };

  return (
    <NewProjectForm
      onBackToDashboard={handleBackToDashboard}
      onClose={handleClose}
    />
  );
};

export default ProjectNewPage;
