import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import OpportunityDetailPage from './OpportunityDetailPage';

const OpportunityDetailPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug, opportunityId } = useParams();
  const { tenant } = useTenant();

  const handleBack = () => {
    navigate(`/${tenantSlug}/firsatlar`);
  };

  const handleEdit = (opportunity) => {
    const id = opportunity?.id || opportunityId;
    navigate(`/${tenantSlug}/firsatlar/${id}/duzenle`);
  };

  return (
    <OpportunityDetailPage
      opportunityId={opportunityId}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
};

export default OpportunityDetailPageWrapper;
