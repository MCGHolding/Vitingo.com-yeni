import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ProposalProfileWizard from './ProposalProfileWizard';

const ProposalProfileWizardWrapper = () => {
  const navigate = useNavigate();
  const { tenantSlug, profileId } = useParams();
  const { tenant } = useTenant();

  return (
    <ProposalProfileWizard />
  );
};

export default ProposalProfileWizardWrapper;
