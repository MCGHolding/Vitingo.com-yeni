import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import LibraryPageComponent from '../../components/Settings/LibraryPage';

const LibraryPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return <LibraryPageComponent onBack={handleBack} />;
};

export default LibraryPage;
