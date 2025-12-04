import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CreditCardsManagement from '../../components/Settings/CreditCardsManagement';

const CreditCardsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return (
    <CreditCardsManagement onBackToDashboard={handleBackToDashboard} />
  );
};

export default CreditCardsPage;
