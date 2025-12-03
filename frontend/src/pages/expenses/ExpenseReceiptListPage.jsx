import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllExpenseReceiptsPage from '../../components/ExpenseReceipts/AllExpenseReceiptsPage';

const ExpenseReceiptListPage = () => {
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
    <AllExpenseReceiptsPage
      onBackToDashboard={handleBackToDashboard}
      onNewExpenseReceipt={handleNewExpenseReceipt}
    />
  );
};

export default ExpenseReceiptListPage;
