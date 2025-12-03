import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import PendingApprovalExpenseReceiptsPage from '../../components/ExpenseReceipts/PendingApprovalExpenseReceiptsPage';

const PendingExpenseReceiptsPage = () => {
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
    <PendingApprovalExpenseReceiptsPage
      onBackToDashboard={handleBackToDashboard}
      onNewExpenseReceipt={handleNewExpenseReceipt}
    />
  );
};

export default PendingExpenseReceiptsPage;
