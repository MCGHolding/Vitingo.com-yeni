import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllPeoplePage from '../../components/Customers/AllPeoplePage';

const PeopleListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend URL
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    'https://banktrans.preview.emergentagent.com';

  // Kişileri yükle
  const loadPeople = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/people`);
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
        console.log(`✅ Loaded ${data.length} people`);
      }
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleUpdatePerson = (updatedPerson) => {
    setPeople(prev => prev.map(p => 
      p.id === updatedPerson.id ? updatedPerson : p
    ));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AllPeoplePage
      people={people}
      refreshPeople={loadPeople}
      onBackToDashboard={handleBackToDashboard}
      onUpdatePerson={handleUpdatePerson}
    />
  );
};

export default PeopleListPage;
