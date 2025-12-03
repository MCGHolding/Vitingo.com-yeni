import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import NewOpportunityFormPage from '../../components/Opportunities/NewOpportunityFormPage';

const OpportunityNewPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleSave = async (opportunityData) => {
    // Form component kendi içinde API çağrısı yapıyor
    // Başarılı kayıt sonrası listeye dön
    navigate(`/${tenantSlug}/firsatlar`);
  };

  const handleClose = () => {
    navigate(`/${tenantSlug}/firsatlar`);
  };

  return (
    <NewOpportunityFormPage
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default OpportunityNewPage;
