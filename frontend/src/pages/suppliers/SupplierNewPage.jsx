import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewSupplierForm from '../../components/Suppliers/NewSupplierForm';

const SupplierNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleClose = () => {
    navigate(`/${tenantSlug}/tedarikciler`);
  };

  return (
    <NewSupplierForm onClose={handleClose} />
  );
};

export default SupplierNewPage;
