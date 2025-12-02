import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import EditProjectPage from '../../components/Projects/EditProjectPage';

const ProjectEditPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug, projectId } = useParams();
  const { tenant } = useTenant();

  const handleClose = () => {
    navigate(`/${tenantSlug}/projeler`);
  };

  const handleSave = () => {
    navigate(`/${tenantSlug}/projeler`);
  };

  return (
    <EditProjectPage
      projectId={projectId}
      onClose={handleClose}
      onSave={handleSave}
    />
  );
};

export default ProjectEditPageWrapper;
