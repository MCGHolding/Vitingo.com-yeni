import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import SettingsPage from '../../components/Settings/SettingsPage';

const SettingsMainPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const { user } = useAuth();

  const handleBack = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleNavigate = (view) => {
    const viewToPath = {
      'group-companies': 'sirketler',
      'contract-management': 'sozlesme-yonetimi',
      'user-management': 'kullanicilar',
      'user-positions': 'pozisyonlar',
      'department-management': 'departmanlar',
      'expense-centers': 'masraf-merkezleri',
      'advance-categories': 'avans-kategorileri',
      'expense-categories': 'gider-kategorileri',
      'transaction-types': 'islem-turleri',
      'library': 'kutuphane',
      'bank-management': 'banka-yonetimi',
      'credit-cards': 'kredi-kartlari'
    };
    
    const path = viewToPath[view];
    if (path) {
      navigate(`/${tenantSlug}/ayarlar/${path}`);
    }
  };

  return (
    <SettingsPage
      onBack={handleBack}
      currentUser={user}
      onNavigate={handleNavigate}
    />
  );
};

export default SettingsMainPage;
