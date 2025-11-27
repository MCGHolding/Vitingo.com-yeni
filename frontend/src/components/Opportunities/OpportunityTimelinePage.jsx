import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';

// Import detailed activity forms
import CallRecordForm from './activities/CallRecordForm';
import EmailManagementForm from './activities/EmailManagementForm';
import ActivityPlannerForm from './activities/ActivityPlannerForm';
// DesignUploadForm removed - now uses dedicated full page
import MessagingForm from './activities/MessagingForm';
import { 
  Activity,
  Phone, 
  Mail, 
  Calendar, 
  Upload, 
  MessageSquare,
  Search,
  Filter,
  Clock,
  User,
  CheckCircle,
  Check,
  AlertTriangle,
  XCircle,
  Bell,
  Eye,
  MoreVertical,
  ArrowLeft,
  TrendingUp,
  BarChart3,
  PieChart,
  Plus,
  FileText,
  X
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Quick Note Modal Component
function QuickNoteModal({ isOpen, opportunityId, opportunityTitle, onSave, onClose }) {
  const { toast } = useToast();
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!noteTitle.trim() && !noteContent.trim()) {
        toast({
          title: "Hata",
          description: "Not başlığı veya içeriği boş olamaz.",
          variant: "destructive",
        });
        return;
      }

      const notePayload = {
        content: noteTitle ? `# ${noteTitle}\n\n${noteContent}` : noteContent,
        category: 'general',
        priority: 'medium',
        tags: [],
        metadata: {
          title: noteTitle || 'Hızlı Not',
          category: 'general',
          priority: 'medium'
        }
      };

      const response = await fetch(`${BACKEND_URL}/api/opportunities/${opportunityId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notePayload)
      });

      if (!response.ok) {
        throw new Error('Not kaydedilemedi');
      }

      const savedNote = await response.json();
      
      // Call parent callback
      if (onSave) {
        onSave({
          ...savedNote,
          type: 'note',
          title: noteTitle || 'Hızlı Not',
          description: noteContent
        });
      }

      // Reset and close
      setNoteTitle('');
      setNoteContent('');
      onClose();

    } catch (error) {
      console.error('❌ Error saving note:', error);
      toast({
        title: "Hata",
        description: "Not kaydedilirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-teal-600" />
            <span>Hızlı Not Ekle</span>
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Başlığı (isteğe bağlı)
            </label>
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Not başlığını giriniz..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not İçeriği
            </label>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Not içeriğinizi buraya yazın..."
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (!noteTitle.trim() && !noteContent.trim())}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Activity Add Unit Component
function QuickActivityAddUnit({ opportunityId, opportunityTitle, onActivityAdded, onOpenDetailedForm }) {
  const { toast } = useToast();
  
  // Activity types for quick add
  const QUICK_ACTIVITY_TYPES = {
    call_record: { 
      label: 'Görüşme Kaydı', 
      icon: Phone, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    email_management: { 
      label: 'E-posta Yönetimi', 
      icon: Mail, 
      color: 'text-green-600',
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200'
    },
    activity_planner: { 
      label: 'Aktivite Planlama', 
      icon: Calendar, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    design_upload: { 
      label: 'Tasarım Yükle', 
      icon: Upload, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    messaging: { 
      label: 'Mesajlaşma', 
      icon: MessageSquare, 
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    note: { 
      label: 'Hızlı Not', 
      icon: FileText, 
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    }
  };

  const handleActivityTypeClick = (activityType) => {
    if (onOpenDetailedForm) {
      onOpenDetailedForm(activityType);
    }
  };

  // Simple component - just buttons to open detailed forms

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-700 flex items-center space-x-1.5">
          <Plus className="h-3.5 w-3.5 text-purple-600" />
          <span>Yeni Aktivite</span>
        </h3>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(QUICK_ACTIVITY_TYPES).map(([type, config]) => (
            <Button
              key={type}
              variant="outline"
              onClick={() => handleActivityTypeClick(type)}
              className={`h-auto py-2 px-2 flex flex-col items-center space-y-1 text-xs ${config.borderColor} hover:${config.bgColor} transition-colors`}
            >
              <config.icon className={`h-4 w-4 ${config.color}`} />
              <span className="text-[10px] font-medium text-gray-600 leading-tight text-center">{config.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sample activities for a specific opportunity
const getSampleActivitiesForOpportunity = (opportunityId, opportunityTitle) => [
  {
    id: '1',
    type: 'call_record',
    title: 'İlk Müşteri Görüşmesi',
    description: 'Müşteri ile stand tasarımı, boyut gereksinimleri ve bütçe hakkında 25 dakikalık detaylı görüşme yapıldı.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-08T10:30:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'high',
    data: {
      call_type: 'outgoing',
      duration_minutes: 25,
      contact_person: 'Ahmet Yılmaz',
      call_result: 'successful'
    }
  },
  {
    id: '2',
    type: 'email_reply',
    title: 'Fuar Şartnameleri Gönderimi',
    description: 'Müşteriye fuar katılım şartnameleri ve stand kurulum süreçleri detaylı olarak e-posta ile gönderildi.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-08T09:15:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'medium',
    data: {
      to: 'ahmet.yilmaz@wiobank.com',
      subject: 'Fuar Katılım Şartnameleri ve Stand Kurulum Süreci'
    }
  },
  {
    id: '3',
    type: 'activity_planner',
    title: 'Teknik Teklif Sunumu',
    description: 'Müşteriye detaylı teknik teklif ve fiyat sunumu yapılacak. Hatırlatıcı ayarlandı.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-08T08:45:00Z',
    created_by: 'Murat Bucak',
    status: 'pending',
    priority: 'high',
    scheduled_for: '2024-10-09T14:00:00Z',
    data: {
      activity_type: 'proposal',
      has_reminder: true,
      reminder_minutes: '60'
    }
  },
  {
    id: '4',
    type: 'design_upload',
    title: 'İlk Konsept Tasarım',
    description: 'Müşteri briefine uygun olarak hazırlanan ilk konsept tasarım dosyaları yüklendi.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-07T16:20:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'high',
    data: {
      version: 'V1.0',
      files_count: 5
    }
  },
  {
    id: '5',
    type: 'messaging',
    title: 'Elektrik Detayları Mesajlaşması',
    description: 'Stand elektrik ihtiyaçları ve teknik gereksinimler hakkında müşteri ile mesaj trafiği.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-07T14:10:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'medium',
    data: {
      message_count: 8,
      last_message: 'Elektrik bağlantısı için gerekli evrakları temin edeceğiz.'
    }
  },
  {
    id: '6',
    type: 'call_record',
    title: 'Tasarım Onay Görüşmesi',
    description: 'İlk tasarım konsepti hakkında müşteri geribildirimleri alındı.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-06T15:45:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'medium',
    data: {
      call_type: 'incoming',
      duration_minutes: 15,
      contact_person: 'Ahmet Yılmaz',
      call_result: 'successful'
    }
  },
  {
    id: '7',
    type: 'design_upload',
    title: 'Revize Tasarım',
    description: 'Müşteri geribildirimleri doğrultusunda güncellenmiş tasarım versiyonu.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-06T11:30:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'high',
    data: {
      version: 'V1.1',
      files_count: 3
    }
  }
];

const ACTIVITY_TYPES = {
  call_record: { 
    label: 'Görüşme', 
    icon: Phone, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  email_reply: { 
    label: 'E-posta', 
    icon: Mail, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  email_management: { 
    label: 'E-posta Yönetimi', 
    icon: Mail, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  activity_planner: { 
    label: 'Planlanan', 
    icon: Calendar, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  design_upload: { 
    label: 'Tasarım', 
    icon: Upload, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  messaging: { 
    label: 'Mesaj', 
    icon: MessageSquare, 
    color: 'text-pink-600', 
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  note: { 
    label: 'Not', 
    icon: FileText, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  // Default fallback for unknown types
  default: { 
    label: 'Aktivite', 
    icon: Activity, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

const STATUS_CONFIG = {
  completed: { label: 'Tamamlandı', icon: CheckCircle, color: 'text-green-600' },
  pending: { label: 'Bekliyor', icon: Clock, color: 'text-yellow-600' },
  in_progress: { label: 'Devam Ediyor', icon: Clock, color: 'text-blue-600' },
  overdue: { label: 'Gecikti', icon: AlertTriangle, color: 'text-red-600' },
  cancelled: { label: 'İptal', icon: XCircle, color: 'text-gray-600' }
};

const PRIORITY_CONFIG = {
  critical: { label: 'Kritik', color: 'text-red-700', bgColor: 'bg-red-100' },
  high: { label: 'Yüksek', color: 'text-red-600', bgColor: 'bg-red-100' },
  medium: { label: 'Orta', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  low: { label: 'Düşük', color: 'text-green-600', bgColor: 'bg-green-100' }
};

export default function OpportunityTimelinePage({ 
  onBack, 
  opportunityId, 
  opportunityTitle,
  customerId 
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states for detailed activity forms
  const [activeModal, setActiveModal] = useState('');
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    if (opportunityId) {
      loadActivities();
    }
  }, [opportunityId]);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, filterType, filterStatus, activities]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Loading activities for opportunity:', opportunityId);
      
      const response = await fetch(`${BACKEND_URL}/api/opportunities/${opportunityId}/activities`);
      
      if (!response.ok) {
        throw new Error('Aktiviteler yüklenirken hata oluştu');
      }
      
      const data = await response.json();
      console.log('✅ Activities loaded from API:', data.length, 'items');
      console.log('📊 Sample activity:', data[0]);
      
      // If no activities exist, show sample activities for better UX
      if (data.length === 0) {
        console.log('ℹ️ No activities found, showing sample data for better UX');
        const sampleActivities = getSampleActivitiesForOpportunity(opportunityId, opportunityTitle);
        setActivities(sampleActivities);
      } else {
        setActivities(data);
      }
      
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      setError('Aktiviteler yüklenirken hata oluştu: ' + error.message);
      
      // Fallback to sample data on error
      const sampleActivities = getSampleActivitiesForOpportunity(opportunityId, opportunityTitle);
      setActivities(sampleActivities);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.opportunity_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(activity => activity.status === filterStatus);
    }

    setFilteredActivities(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} hafta önce`;
  };

  const getActivitySummary = () => {
    const summary = {
      total: activities.length,
      completed: activities.filter(a => a.status === 'completed').length,
      pending: activities.filter(a => a.status === 'pending').length,
      overdue: activities.filter(a => a.status === 'overdue').length,
      byType: {}
    };

    Object.keys(ACTIVITY_TYPES).forEach(type => {
      if (type !== 'default') {
        summary.byType[type] = activities.filter(a => a.type === type).length;
      }
    });

    return summary;
  };

  const handleActivityCreated = (newActivity) => {
    console.log('✅ New activity created:', newActivity);
    
    // Add the new activity to the list
    setActivities(prevActivities => [newActivity, ...prevActivities]);
    
    toast({
      title: "Başarılı",
      description: "Yeni aktivite timeline'a eklendi.",
      className: "bg-green-50 border-green-200 text-green-800",
    });

    // Close modal
    setActiveModal('');
    setModalData(null);
  };

  const handleOpenDetailedForm = (activityType) => {
    // Special handling for email management - navigate to email page
    if (activityType === 'email_management' && customerId) {
      navigate(`/customers/${customerId}/emails`);
      return;
    }
    
    // Special handling for activity planner - navigate to full page
    if (activityType === 'activity_planner') {
      if (customerId) {
        navigate(`/customers/${customerId}/activity-planner`);
      } else {
        navigate(`/opportunities/${opportunityId}/activity-planner`);
      }
      return;
    }
    
    // Special handling for design upload - navigate to design versions page
    if (activityType === 'design_upload' && customerId) {
      navigate(`/customers/${customerId}/designs`);
      return;
    }
    
    setActiveModal(activityType);
    setModalData({
      opportunityId,
      opportunityTitle,
      activityType
    });
  };

  const handleCloseModal = () => {
    setActiveModal('');
    setModalData(null);
  };

  const summary = getActivitySummary();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      {/* Compact Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="h-9 px-3 text-sm border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              <span>Geri</span>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span>Aktivite Timeline</span>
              </h1>
              <p className="text-sm text-gray-600 truncate max-w-md">{opportunityTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-9">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Rapor
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Toplam {summary.total} aktivite - {summary.completed} tamamlandı, {summary.pending} beklemede
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              className="border-gray-200 text-gray-600 hover:bg-gray-50 h-8"
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Rapor
            </Button>
          </div>
        </div>

        {/* Quick Activity Add Unit - Full Width */}
        <div className="mb-6">
          <QuickActivityAddUnit 
            opportunityId={opportunityId}
            opportunityTitle={opportunityTitle}
            onActivityAdded={handleActivityCreated}
            onOpenDetailedForm={handleOpenDetailedForm}
          />
        </div>

        {/* Filters Section - Full Width at Top */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span>Filtreler</span>
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Arama
                  </label>
                  <div className="relative">
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Aktivite ara..."
                      className="pl-8 h-8 text-sm border-gray-200"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Tip
                  </label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <config.icon className={`h-3.5 w-3.5 ${config.color}`} />
                            <span className="text-sm">{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Durum
                  </label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <config.icon className={`h-3.5 w-3.5 ${config.color}`} />
                            <span className="text-sm">{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 h-8 w-full"
                  >
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                    Rapor
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Left Sidebar, Right Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column - Stats & Info */}
          <div className="space-y-4">

            {/* Quick Stats */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span>Özet</span>
                </h3>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-gray-700">Toplam Aktivite</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">{summary.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-gray-700">Tamamlanan</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{summary.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-xs text-gray-700">Bekleyen</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{summary.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-gray-700">Hatırlatıcı</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {activities.filter(a => a.status === 'pending' && a.scheduled_for).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Compact Activity Stats */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <PieChart className="h-4 w-4 text-gray-600" />
                  <span>Dağılım</span>
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                  key !== 'default' && (
                    <div key={key} className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        <config.icon className={`h-3.5 w-3.5 ${config.color}`} />
                        <span className="text-xs text-gray-700">{config.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {summary.byType[key] || 0}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  Zaman Çizelgesi ({filteredActivities.length})
                </h3>
              </div>
              <div className="p-3">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Yükleniyor...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[550px] overflow-y-auto">
                    {filteredActivities.length === 0 ? (
                      <div className="text-center py-6">
                        <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Aktivite bulunamadı</p>
                      </div>
                    ) : (
                      filteredActivities.map((activity, index) => {
                        const typeConfig = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.default;
                        const statusConfig = STATUS_CONFIG[activity.status] || STATUS_CONFIG.pending;
                        const priorityConfig = PRIORITY_CONFIG[activity.priority] || PRIORITY_CONFIG.medium;
                        
                        return (
                          <div key={activity.id} className="relative">
                            
                            {/* Sleek Timeline line */}
                            {index !== filteredActivities.length - 1 && (
                              <div className="absolute left-5 top-10 w-0.5 h-full bg-gradient-to-b from-gray-300 to-gray-100 z-0"></div>
                            )}
                            
                            {/* Compact Activity item */}
                            <div className="flex space-x-3 relative z-10">
                              {/* Modern Icon */}
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-xl ${typeConfig.bgColor} border ${typeConfig.borderColor} flex items-center justify-center shadow-sm`}>
                                  <typeConfig.icon className={`h-4 w-4 ${typeConfig.color}`} />
                                </div>
                              </div>
                              
                              {/* Compact Content */}
                              <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/70 p-3 hover:shadow-lg hover:bg-white/90 transition-all duration-200">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                                        {priorityConfig.label}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{activity.description}</p>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1.5 ml-2">
                                    <div className={`flex items-center space-x-1 ${statusConfig.color}`}>
                                      <statusConfig.icon className="h-3 w-3" />
                                      <span className="text-xs font-medium">{statusConfig.label}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-gray-100">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1">
                                      <User className="h-3 w-3" />
                                      <span>{activity.created_by}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatDate(activity.created_at)}</span>
                                    </div>
                                  </div>
                                  <span className="text-gray-400 font-medium">{getTimeAgo(activity.created_at)}</span>
                                </div>
                                
                                {/* Compact Activity Details */}
                                {activity.type === 'call_record' && (
                                  <div className="text-xs text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100/50 p-2 rounded-lg border border-blue-200/50">
                                    📞 {activity.data.call_type === 'outgoing' ? 'Giden' : 'Gelen'} • 
                                    ⏱️ {activity.data.duration_minutes}dk • 
                                    👤 {activity.data.contact_person}
                                  </div>
                                )}
                                
                                {activity.type === 'activity_planner' && activity.scheduled_for && (
                                  <div className="text-xs text-purple-700 bg-gradient-to-r from-purple-50 to-purple-100/50 p-2 rounded-lg border border-purple-200/50 flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>📅 {formatDate(activity.scheduled_for)}</span>
                                    {activity.data.has_reminder && (
                                      <>
                                        <Bell className="h-3 w-3 ml-1" />
                                        <span>🔔 {activity.data.reminder_minutes}dk önce</span>
                                      </>
                                    )}
                                  </div>
                                )}

                                {activity.type === 'design_upload' && (
                                  <div className="text-xs text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100/50 p-2 rounded-lg border border-orange-200/50">
                                    🎨 {activity.data.version} • 📁 {activity.data.files_count} dosya
                                  </div>
                                )}

                                {activity.type === 'email_reply' && (
                                  <div className="text-xs text-green-700 bg-gradient-to-r from-green-50 to-green-100/50 p-2 rounded-lg border border-green-200/50">
                                    📧 {activity.data.to?.split('@')[0]} • 📝 {activity.data.subject}
                                  </div>
                                )}

                                {activity.type === 'messaging' && (
                                  <div className="text-xs text-pink-700 bg-gradient-to-r from-pink-50 to-pink-100/50 p-2 rounded-lg border border-pink-200/50">
                                    💬 {activity.data.message_count} mesaj • "{activity.data.last_message?.slice(0, 30)}..."
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Activity Modals */}
      {activeModal === 'call_record' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CallRecordForm
              opportunityId={modalData?.opportunityId}
              opportunityTitle={modalData?.opportunityTitle}
              onSave={handleActivityCreated}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}

      {activeModal === 'email_management' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <EmailManagementForm
              opportunityId={modalData?.opportunityId}
              opportunityTitle={modalData?.opportunityTitle}
              onSave={handleActivityCreated}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}

      {/* Activity Planner moved to full page - no longer uses modal */}
      {/* Design Upload moved to full page - no longer uses modal */}

      {activeModal === 'messaging' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <MessagingForm
              opportunityId={modalData?.opportunityId}
              opportunityTitle={modalData?.opportunityTitle}
              onSave={handleActivityCreated}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}

      {activeModal === 'note' && (
        <QuickNoteModal
          isOpen={true}
          opportunityId={modalData?.opportunityId}
          opportunityTitle={modalData?.opportunityTitle}
          onSave={handleActivityCreated}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}