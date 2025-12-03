import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import CalendarPage from '../../components/Calendar/CalendarPage';

const CalendarViewPage = () => {
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
    <CalendarPage currentUser={currentUser} />
  );
};

export default CalendarViewPage;
