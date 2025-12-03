import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import ArchivedMeetingsPageComponent from '../../components/Calendar/ArchivedMeetingsPage';

const ArchivedMeetingsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBack = () => {
    navigate(`/${tenantSlug}/takvim`);
  };

  return (
    <ArchivedMeetingsPageComponent onBack={handleBack} />
  );
};

export default ArchivedMeetingsPage;
