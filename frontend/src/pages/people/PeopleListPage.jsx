import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllPeoplePage from '../../components/Customers/AllPeoplePage';

const PeopleListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Backend URL
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    'https://vitingo-dashboard.preview.emergentagent.com';

  // Kişileri yükle - useCallback ile memoize et
  const loadPeople = useCallback(async () => {
    // Zaten yüklendiyse tekrar yükleme
    if (loaded) {
      console.log('⏭️ People already loaded, skipping...');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Loading people...');
      const response = await fetch(`${backendUrl}/api/people`);
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
        setLoaded(true);
        console.log(`✅ Loaded ${data.length} people`);
      }
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, loaded]);

  // Sadece ilk yüklemede çalış
  useEffect(() => {
    if (!loaded) {
      loadPeople();
    }
  }, [loaded, loadPeople]);

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleUpdatePerson = (updatedPerson) => {
    setPeople(prev => prev.map(p => 
      p.id === updatedPerson.id ? updatedPerson : p
    ));
  };

  // Manuel refresh fonksiyonu - useCallback ile memoize et
  const refreshPeople = useCallback(async () => {
    setLoaded(false);
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/people`);
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
        setLoaded(true);
        console.log(`🔄 Refreshed ${data.length} people`);
      }
    } catch (error) {
      console.error('Error refreshing people:', error);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  if (loading && !loaded) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Kişiler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AllPeoplePage
      people={people}
      onBackToDashboard={handleBackToDashboard}
      onUpdatePerson={handleUpdatePerson}
      refreshPeople={refreshPeople}
    />
  );
};

export default PeopleListPage;
