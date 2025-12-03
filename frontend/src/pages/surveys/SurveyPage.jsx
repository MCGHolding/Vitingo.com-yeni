import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import SurveyManagementPage from '../../components/Surveys/SurveyManagementPage';

const SurveyPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  return (
    <SurveyManagementPage
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default SurveyPage;
