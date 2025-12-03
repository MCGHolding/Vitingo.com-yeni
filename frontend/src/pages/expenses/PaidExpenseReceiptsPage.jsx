import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import PaidExpenseReceiptsPageComponent from '../../components/ExpenseReceipts/PaidExpenseReceiptsPage';

const PaidExpenseReceiptsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleNewExpenseReceipt = () => {
    navigate(`/${tenantSlug}/gider-makbuzu/yeni`);
  };

  return (
    <PaidExpenseReceiptsPageComponent
      onBackToDashboard={handleBackToDashboard}
      onNewExpenseReceipt={handleNewExpenseReceipt}
    />
  );
};

export default PaidExpenseReceiptsPage;
