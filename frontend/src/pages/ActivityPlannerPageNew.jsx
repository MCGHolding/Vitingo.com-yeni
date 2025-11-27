import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import ActivityPlannerFormNew from '../components/Opportunities/activities/ActivityPlannerFormNew';
import UpcomingActivities from '../components/Opportunities/activities/UpcomingActivities';
import PriorityActivities from '../components/Opportunities/activities/PriorityActivities';
import AllActivities from '../components/Opportunities/activities/AllActivities';
import EditActivityModal from '../components/Opportunities/activities/EditActivityModal';

export default function ActivityPlannerPageNew() {
  const navigate = useNavigate();
  const { opportunityId, customerId } = useParams();
  const { toast } = useToast();
  const effectiveId = opportunityId || customerId;

  // States
  const [upcomingActivities, setUpcomingActivities] = useState({ today: [], tomorrow: [] });
  const [priorityActivities, setPriorityActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  
  const [activeTab, setActiveTab] = useState('thisWeek');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCompleted, setShowCompleted] = useState(false);
  
  const [editingActivity, setEditingActivity] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch upcoming activities (today + tomorrow)
  const fetchUpcoming = async () => {
    try {
      console.log('🟡 [PAGE] Fetching upcoming activities...');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${effectiveId}/activities/upcoming`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('🟡 [PAGE] Upcoming:', data);
        setUpcomingActivities(data);
      }
    } catch (error) {
      console.error('❌ [PAGE] Error fetching upcoming:', error);
    }
  };

  // Fetch priority activities (high priority, max 5)
  const fetchPriority = async () => {
    try {
      console.log('🟡 [PAGE] Fetching priority activities...');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${effectiveId}/activities?priority=high&status=planned&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('🟡 [PAGE] Priority:', data);
        setPriorityActivities(data);
      }
    } catch (error) {
      console.error('❌ [PAGE] Error fetching priority:', error);
    }
  };

  // Fetch all activities with filters
  const fetchAllActivities = async () => {
    try {
      console.log('🟡 [PAGE] Fetching all activities...', { activeTab, typeFilter, searchQuery, page, showCompleted });
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: showCompleted ? 'all' : 'planned',
        tab: activeTab,
        ...(typeFilter !== 'all' && { activity_type: typeFilter }),
        ...(searchQuery && { search: searchQuery })
      });
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${effectiveId}/activities?${params}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('🟡 [PAGE] All activities:', data.length, 'items');
        setAllActivities(data);
        
        // Calculate total pages (backend doesn't return this yet, so estimate)
        setTotalPages(Math.ceil(data.length / 10));
      }
    } catch (error) {
      console.error('❌ [PAGE] Error fetching all activities:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (effectiveId) {
      fetchUpcoming();
      fetchPriority();
    }
  }, [effectiveId]);

  // Reload all activities when filters change
  useEffect(() => {
    if (effectiveId) {
      fetchAllActivities();
    }
  }, [effectiveId, activeTab, typeFilter, searchQuery, page, showCompleted]);

  // Handlers
  const handleSave = (savedActivity) => {
    console.log('✅ [PAGE] Activity saved, refreshing all lists...');
    fetchUpcoming();
    fetchPriority();
    fetchAllActivities();
  };

  const handleCancel = () => {
    // Navigate to customer timeline page instead of browser back
    navigate(`/customers/${effectiveId}`);
  };

  const handleComplete = async (activityId) => {
    try {
      console.log('🟡 [PAGE] Completing activity:', activityId);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${effectiveId}/activities/${activityId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        }
      );

      if (response.ok) {
        toast({
          title: "✅ Başarılı",
          description: "Aktivite tamamlandı",
        });
        fetchUpcoming();
        fetchPriority();
        fetchAllActivities();
      }
    } catch (error) {
      console.error('❌ [PAGE] Complete error:', error);
      toast({
        title: "❌ Hata",
        description: "İşlem başarısız",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
  };

  const handleEditSaved = () => {
    setEditingActivity(null);
    fetchUpcoming();
    fetchPriority();
    fetchAllActivities();
  };

  const handleDelete = async (activityId) => {
    if (!window.confirm('Bu aktiviteyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      console.log('🟡 [PAGE] Deleting activity:', activityId);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${effectiveId}/activities/${activityId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast({
          title: "✅ Başarılı",
          description: "Aktivite silindi",
        });
        fetchUpcoming();
        fetchPriority();
        fetchAllActivities();
      }
    } catch (error) {
      console.error('❌ [PAGE] Delete error:', error);
      toast({
        title: "❌ Hata",
        description: "Silme işlemi başarısız",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleCancel}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Aktivite Planlama</h1>
            <p className="text-xs sm:text-sm text-gray-500">Yeni aktivite ve hatırlatıcı oluştur</p>
          </div>
        </div>

        {/* ========== FORM BÖLÜMÜ ========== */}
        <ActivityPlannerFormNew
          opportunityId={effectiveId}
          opportunityTitle="Müşteri"
          onSave={handleSave}
          onCancel={handleCancel}
        />

        {/* ========== YAKIN AKTİVİTELER ========== */}
        <UpcomingActivities
          today={upcomingActivities.today}
          tomorrow={upcomingActivities.tomorrow}
          onComplete={handleComplete}
          onEdit={handleEdit}
        />

        {/* ========== ÖNCELİKLİ AKTİVİTELER ========== */}
        <PriorityActivities
          activities={priorityActivities}
          onComplete={handleComplete}
          onEdit={handleEdit}
          onViewAll={() => {
            setActiveTab('all');
            setTypeFilter('all');
            setSearchQuery('');
            setPage(1);
          }}
        />

        {/* ========== TÜM AKTİVİTELER ========== */}
        <AllActivities
          activities={allActivities}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onComplete={handleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showCompleted={showCompleted}
          onShowCompletedChange={setShowCompleted}
        />

        {/* Edit Modal */}
        {editingActivity && (
          <EditActivityModal
            activity={editingActivity}
            opportunityId={effectiveId}
            onClose={() => setEditingActivity(null)}
            onSaved={handleEditSaved}
          />
        )}
      </div>
    </div>
  );
}
