import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import DepartmentsPageComponent from '../../components/Settings/DepartmentsPage';

const DepartmentsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return <DepartmentsPageComponent onBack={handleBack} />;
};

export default DepartmentsPage;
