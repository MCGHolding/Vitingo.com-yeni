import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewExpenseReceiptForm from '../../components/ExpenseReceipts/NewExpenseReceiptForm';

const ExpenseReceiptNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}/gider-makbuzu`);
  };

  return (
    <NewExpenseReceiptForm
      onBackToDashboard={handleBackToDashboard}
    />
  );
};

export default ExpenseReceiptNewPage;
