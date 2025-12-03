import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import PositionsPageComponent from '../../components/Settings/PositionsPage';

const PositionsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return <PositionsPageComponent onBack={handleBack} />;
};

export default PositionsPage;
