import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllOpportunitiesPage from '../../components/Opportunities/AllOpportunitiesPage';

const OpportunityListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const location = useLocation();
  const { tenant } = useTenant();
  
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend URL
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    'https://saas-migration.preview.emergentagent.com';

  // URL'den filtre belirle
  const getFilterFromPath = () => {
    const path = location.pathname;
    if (path.includes('/acik')) return 'open';
    if (path.includes('/kazanilan')) return 'won';
    if (path.includes('/kaybedilen')) return 'lost';
    if (path.includes('/favoriler')) return 'favorites';
    return 'all';
  };

  const currentFilter = getFilterFromPath();

  // Fırsatları yükle
  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/opportunities`);
      if (response.ok) {
        let data = await response.json();
        
        // Filtreleme uygula
        if (currentFilter === 'open') {
          data = data.filter(o => o.status === 'open' || o.status === 'open-active');
        } else if (currentFilter === 'won') {
          data = data.filter(o => o.status === 'won' || o.status === 'kazanildi');
        } else if (currentFilter === 'lost') {
          data = data.filter(o => o.status === 'lost' || o.status === 'kaybedildi');
        } else if (currentFilter === 'favorites') {
          data = data.filter(o => o.isFavorite === true);
        }
        
        setOpportunities(data);
        console.log(`✅ Loaded ${data.length} opportunities (filter: ${currentFilter})`);
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [currentFilter]);

  // Navigation handlers
  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleEditOpportunity = (opportunity) => {
    navigate(`/${tenantSlug}/firsatlar/${opportunity.id}/duzenle`);
  };

  const handleViewOpportunity = (opportunity) => {
    navigate(`/${tenantSlug}/firsatlar/${opportunity.id}`);
  };

  const handleNewOpportunity = () => {
    navigate(`/${tenantSlug}/firsatlar/yeni`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AllOpportunitiesPage
      opportunities={opportunities}
      refreshOpportunities={loadOpportunities}
      onBackToDashboard={handleBackToDashboard}
      onEditOpportunity={handleEditOpportunity}
      onViewOpportunity={handleViewOpportunity}
    />
  );
};

export default OpportunityListPage;
