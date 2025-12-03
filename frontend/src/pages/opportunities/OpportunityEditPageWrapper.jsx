import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import OpportunityEditPageNew from './OpportunityEditPage';

const OpportunityEditPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug, opportunityId } = useParams();
  const { tenant } = useTenant();

  const handleBack = () => {
    navigate(`/${tenantSlug}/firsatlar/${opportunityId}`);
  };

  const handleSave = (updatedOpportunity) => {
    console.log('Opportunity updated:', updatedOpportunity);
    navigate(`/${tenantSlug}/firsatlar`);
  };

  return (
    <OpportunityEditPageNew
      opportunityId={opportunityId}
      onBack={handleBack}
      onSave={handleSave}
    />
  );
};

export default OpportunityEditPageWrapper;
