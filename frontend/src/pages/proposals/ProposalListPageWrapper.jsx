import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ProposalListPage from './ProposalListPage';

const ProposalListPageWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleNewProposal = () => {
    navigate(`/${tenantSlug}/teklifler/yeni`);
  };

  const handleViewProposal = (proposalId) => {
    navigate(`/${tenantSlug}/teklifler/${proposalId}`);
  };

  return (
    <ProposalListPage
      onNewProposal={handleNewProposal}
      onViewProposal={handleViewProposal}
    />
  );
};

export default ProposalListPageWrapper;
