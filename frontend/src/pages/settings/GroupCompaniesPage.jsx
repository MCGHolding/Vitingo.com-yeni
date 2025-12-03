import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import GroupCompaniesPageComponent from '../../components/Settings/GroupCompaniesPage';

const GroupCompaniesPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return <GroupCompaniesPageComponent onBack={handleBack} />;
};

export default GroupCompaniesPage;
