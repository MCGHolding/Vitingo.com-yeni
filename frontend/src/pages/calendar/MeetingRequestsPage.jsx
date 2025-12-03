import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import MeetingRequestsPageComponent from '../../components/Calendar/MeetingRequestsPage';

const MeetingRequestsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const { user } = useAuth();

  const currentUser = {
    id: user?.id || 'demo_user',
    role: user?.role || 'user',
    name: user?.name || 'Demo User'
  };

  return (
    <MeetingRequestsPageComponent currentUser={currentUser} />
  );
};

export default MeetingRequestsPage;
