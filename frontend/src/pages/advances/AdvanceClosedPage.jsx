import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ClosedAdvances from '../../components/Advances/ClosedAdvances';

const AdvanceClosedPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  // ClosedAdvances component'ini render et (kapalı avanslar)
  return <ClosedAdvances />;
};

export default AdvanceClosedPage;
