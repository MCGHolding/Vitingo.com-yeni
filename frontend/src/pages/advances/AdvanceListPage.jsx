import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ApprovedAdvances from '../../components/Advances/ApprovedAdvances';

const AdvanceListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBack = () => {
    navigate(`/${tenantSlug}`);
  };

  // ApprovedAdvances component'ini render et (onaylanan avanslar listesi)
  return <ApprovedAdvances />;
};

export default AdvanceListPage;
