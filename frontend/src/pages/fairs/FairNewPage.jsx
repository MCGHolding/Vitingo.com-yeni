import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewFairFormSimple from '../../components/Fairs/NewFairFormSimple';

const FairNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleClose = () => {
    navigate(`/${tenantSlug}/fuarlar`);
  };

  return (
    <NewFairFormSimple onClose={handleClose} />
  );
};

export default FairNewPage;
