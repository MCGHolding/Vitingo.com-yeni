import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CreditCardsManagementV2 from '../../components/Settings/CreditCardsManagementV2';

const CreditCardsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return (
    <CreditCardsManagementV2 onBackToDashboard={handleBackToDashboard} />
  );
};

export default CreditCardsPage;
