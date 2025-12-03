import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import UserManagementPageComponent from '../../components/Settings/UserManagementPage';

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return <UserManagementPageComponent onBack={handleBack} />;
};

export default UserManagementPage;
