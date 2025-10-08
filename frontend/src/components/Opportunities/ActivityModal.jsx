import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { 
  X, 
  Phone,
  Mail,
  Calendar,
  Upload,
  MessageSquare,
  ArrowLeft,
  Activity,
  Clock,
  FileText,
  Send,
  Bell,
  Image,
  User,
  CheckCircle
} from 'lucide-react';

// Activity Type Components
import CallRecordForm from './activities/CallRecordForm';
import EmailManagementForm from './activities/EmailManagementForm';
import ActivityPlannerForm from './activities/ActivityPlannerForm';
import DesignUploadForm from './activities/DesignUploadForm';
import MessagingForm from './activities/MessagingForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ACTIVITY_TYPES = [
  {
    id: 'call_record',
    title: 'Görüşme Kaydı',
    description: 'Müşteri ile yapılan telefon görüşmelerini kaydet',
    icon: Phone,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700'
  },
  {
    id: 'email_management',
    title: 'E-posta Yönetimi',
    description: 'Müşteri e-postalarını görüntüle ve yanıtla',
    icon: Mail,
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700'
  },
  {
    id: 'activity_planner',
    title: 'Aktivite Planlama',
    description: 'Hatırlatıcılı aktivite ve görevler oluştur',
    icon: Calendar,
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700'
  },
  {
    id: 'design_upload',
    title: 'Tasarım Yükle',
    description: 'Yeni tasarım versiyonları yükle ve yönet',
    icon: Upload,
    color: 'bg-orange-600',
    hoverColor: 'hover:bg-orange-700'
  },
  {
    id: 'messaging',
    title: 'Mesajlaşma',
    description: 'Müşteri ile uygulama içi mesajlaşma',
    icon: MessageSquare,
    color: 'bg-pink-600',
    hoverColor: 'hover:bg-pink-700'
  }
];

export default function ActivityModal({ isOpen, onClose, opportunityId, opportunityTitle, onActivityCreated }) {
  const { toast } = useToast();
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleActivityTypeSelect = (activityType) => {
    setSelectedActivityType(activityType);
  };

  const handleBackToSelection = () => {
    setSelectedActivityType(null);
    setActivityData(null);
  };

  const handleActivitySave = async (data) => {
    try {
      setSaving(true);
      console.log('💾 Saving activity:', data);
      
      const activityPayload = {
        type: selectedActivityType.id,
        title: data.title || selectedActivityType.title,
        description: data.description || data.summary || '',
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        scheduled_for: data.scheduled_for || null,
        data: data
      };
      
      console.log('🔄 Activity payload:', activityPayload);
      
      const response = await fetch(`${BACKEND_URL}/api/opportunities/${opportunityId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityPayload)
      });
      
      if (!response.ok) {
        throw new Error('Aktivite kaydedilemedi');
      }
      
      const savedActivity = await response.json();
      console.log('✅ Activity saved successfully:', savedActivity);
      
      toast({
        title: "Başarılı",
        description: "Aktivite başarıyla kaydedildi.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Call parent callback to refresh timeline
      if (onActivityCreated) {
        onActivityCreated(savedActivity);
      }
      
      // Close modal and reset state
      onClose();
      setSelectedActivityType(null);
      setActivityData(null);
      
    } catch (error) {
      console.error('❌ Error saving activity:', error);
      toast({
        title: "Hata",
        description: "Aktivite kaydedilirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderActivityForm = () => {
    if (!selectedActivityType) return null;

    const commonProps = {
      opportunityId,
      opportunityTitle,
      onSave: handleActivitySave,
      onCancel: handleBackToSelection
    };

    switch (selectedActivityType.id) {
      case 'call_record':
        return <CallRecordForm {...commonProps} />;
      case 'email_management':
        return <EmailManagementForm {...commonProps} />;
      case 'activity_planner':
        return <ActivityPlannerForm {...commonProps} />;
      case 'design_upload':
        return <DesignUploadForm {...commonProps} />;
      case 'messaging':
        return <MessagingForm {...commonProps} />;
      default:
        return null;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl h-[90vh] bg-white shadow-2xl flex flex-col">
        
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedActivityType && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSelection}
                  className="text-white hover:bg-indigo-600 p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <CardTitle className="text-xl font-bold flex items-center space-x-2">
                <Activity className="h-6 w-6" />
                <span>
                  {selectedActivityType ? selectedActivityType.title : 'Yeni Aşama Ekle'}
                </span>
              </CardTitle>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-indigo-600 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Opportunity info */}
          <div className="mt-2 text-indigo-100 text-sm">
            <p className="font-medium">{opportunityTitle}</p>
            <p className="text-xs opacity-75">
              {selectedActivityType ? selectedActivityType.description : 'Müşteri ile ilgili yeni bir aktivite seçin'}
            </p>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          {!selectedActivityType ? (
            // Activity Type Selection
            <div className="h-full overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ACTIVITY_TYPES.map((activityType) => {
                  const IconComponent = activityType.icon;
                  return (
                    <Card 
                      key={activityType.id}
                      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-indigo-300"
                      onClick={() => handleActivityTypeSelect(activityType)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className={`w-16 h-16 ${activityType.color} ${activityType.hoverColor} rounded-full flex items-center justify-center mx-auto mb-4 transition-colors`}>
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {activityType.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {activityType.description}
                        </p>
                        
                        {/* Additional info based on type */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {activityType.id === 'call_record' && (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Süre & Sonuç</span>
                            </div>
                          )}
                          {activityType.id === 'email_management' && (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <Send className="h-3 w-3 mr-1" />
                              <span>Gelen & Giden</span>
                            </div>
                          )}
                          {activityType.id === 'activity_planner' && (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <Bell className="h-3 w-3 mr-1" />
                              <span>3 Hatırlatıcı Tipi</span>
                            </div>
                          )}
                          {activityType.id === 'design_upload' && (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <Image className="h-3 w-3 mr-1" />
                              <span>Versiyonlu Tasarım</span>
                            </div>
                          )}
                          {activityType.id === 'messaging' && (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <User className="h-3 w-3 mr-1" />
                              <span>Anlık Mesajlaşma</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Quick Stats Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                  Son Aktiviteler
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Son Görüşme</span>
                    </div>
                    <p className="text-xs text-blue-700">2 gün önce - 15 dk</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Son E-posta</span>
                    </div>
                    <p className="text-xs text-green-700">1 gün önce - Yanıtlandı</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Planlanan</span>
                    </div>
                    <p className="text-xs text-purple-700">Yarın - Teklif gönderimi</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Selected Activity Form
            <div className="h-full overflow-y-auto">
              {renderActivityForm()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}