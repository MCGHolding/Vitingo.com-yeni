import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewBriefForm from '../../components/Brief/NewBriefForm';

const BriefNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}/briefler`);
  };

  return (
    <NewBriefForm
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default BriefNewPage;
