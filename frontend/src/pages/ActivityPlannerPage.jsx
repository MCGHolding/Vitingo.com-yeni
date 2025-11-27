import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import ActivityPlannerForm from '../components/Opportunities/activities/ActivityPlannerForm';

export default function ActivityPlannerPage() {
  const navigate = useNavigate();
  const { opportunityId, customerId } = useParams();

  const handleSave = (savedActivity) => {
    // Activity saved successfully, navigate back
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Geri</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Aktivite Planlama</h1>
                <p className="text-sm text-gray-600">Yeni aktivite ve hatırlatıcı oluştur</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <ActivityPlannerForm
            opportunityId={opportunityId || customerId}
            opportunityTitle="Müşteri"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
