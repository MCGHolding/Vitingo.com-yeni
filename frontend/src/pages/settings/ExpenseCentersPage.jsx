import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ExpenseCentersPageComponent from '../../components/Settings/ExpenseCentersPage';

const ExpenseCentersPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  return <ExpenseCentersPageComponent onBack={handleBack} />;
};

export default ExpenseCentersPage;
