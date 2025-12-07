import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllPeoplePage from '../../components/Customers/AllPeoplePage';
import apiClient from '../../utils/apiClient';

const PeopleListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

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
      const response = await apiClient.getPeople();
      const peopleList = response.data || response || [];
      setPeople(peopleList);
      setLoaded(true);
      console.log(`✅ Loaded ${peopleList.length} people`);
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

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
      const response = await apiClient.getPeople();
      const peopleList = response.data || response || [];
      setPeople(peopleList);
      setLoaded(true);
      console.log(`🔄 Refreshed ${peopleList.length} people`);
    } catch (error) {
      console.error('Error refreshing people:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
