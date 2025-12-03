import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ApprovedExpenseReceiptsPageComponent from '../../components/ExpenseReceipts/ApprovedExpenseReceiptsPage';

const ApprovedExpenseReceiptsPage = () => {
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
    <ApprovedExpenseReceiptsPageComponent
      onBackToDashboard={handleBackToDashboard}
      onNewExpenseReceipt={handleNewExpenseReceipt}
    />
  );
};

export default ApprovedExpenseReceiptsPage;
