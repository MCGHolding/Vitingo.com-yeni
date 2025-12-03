import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdvanceCategoriesPageComponent from '../../components/Settings/AdvanceCategoriesPage';

const AdvanceCategoriesPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return <AdvanceCategoriesPageComponent onBack={handleBack} />;
};

export default AdvanceCategoriesPage;
