import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import FinanceApproval from '../../components/Advances/FinanceApproval';

const AdvanceFinanceApprovalPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  // FinanceApproval component'ini render et (finans onayı bekleyen avanslar)
  return <FinanceApproval />;
};

export default AdvanceFinanceApprovalPage;
