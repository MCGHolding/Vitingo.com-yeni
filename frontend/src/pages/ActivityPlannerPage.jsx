import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import ActivityPlannerFormNew from '../components/Opportunities/activities/ActivityPlannerFormNew';
import ActivityList from '../components/Opportunities/activities/ActivityList';
import EditActivityModal from '../components/Opportunities/activities/EditActivityModal';

export default function ActivityPlannerPage() {
  const navigate = useNavigate();
  const { opportunityId, customerId } = useParams();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingActivity, setEditingActivity] = useState(null);

  const handleSave = (savedActivity) => {
    // Activity saved successfully, refresh list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
  };

  const handleEditSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tek Container - Her şey aynı genişlikte */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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

        {/* Activity Creation Form */}
        <ActivityPlannerFormNew
          opportunityId={opportunityId || customerId}
          opportunityTitle="Müşteri"
          onSave={handleSave}
          onCancel={handleCancel}
        />

        {/* Activity List */}
        <ActivityList
          opportunityId={opportunityId || customerId}
          refreshTrigger={refreshTrigger}
          onEdit={handleEdit}
        />

        {/* Edit Modal */}
        {editingActivity && (
          <EditActivityModal
            activity={editingActivity}
            opportunityId={opportunityId || customerId}
            onClose={() => setEditingActivity(null)}
            onSaved={handleEditSaved}
          />
        )}
      </div>
    </div>
  );
}
