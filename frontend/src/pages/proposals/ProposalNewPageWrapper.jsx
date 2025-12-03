import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewProposalWizard from './NewProposalWizard';

const ProposalNewPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug, proposalId } = useParams();
  const { tenant } = useTenant();

  const handleBack = () => {
    navigate(`/${tenantSlug}/teklifler`);
  };

  return (
    <NewProposalWizard
      onBack={handleBack}
      editProposalId={proposalId || null}
    />
  );
};

export default ProposalNewPageWrapper;
