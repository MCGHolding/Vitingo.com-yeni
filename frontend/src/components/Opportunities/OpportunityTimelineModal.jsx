import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  AlertTriangle,
  XCircle,
  Bell,
  Eye,
  MoreVertical,
  X,
  TrendingUp,
  BarChart3,
  PieChart,
  Plus
} from 'lucide-react';

// Sample activities for a specific opportunity
const getSampleActivitiesForOpportunity = (opportunityId, opportunityTitle) => [
  {
    id: '1',
    type: 'call_record',
    title: 'İlk Görüşme - Stand Tasarımı',
    description: 'Müşteri ile stand boyutu ve tasarım tercihleri hakkında 20 dakikalık detaylı görüşme yapıldı.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-08T10:30:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'high',
    data: {
      call_type: 'outgoing',
      duration_minutes: 20,
      contact_person: 'Ahmet Yılmaz',
      call_result: 'successful'
    }
  },
  {
    id: '2',
    type: 'email_reply',
    title: 'Teknik Detaylar E-postası',
    description: 'Stand kurulum süreci ve fuar şartnameleri müşteriye gönderildi.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-08T09:15:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'medium',
    data: {
      to: 'ahmet.yilmaz@wiobank.com',
      subject: 'Stand Kurulum Süreci ve Teknik Detaylar'
    }
  },
  {
    id: '3',
    type: 'activity_planner',
    title: 'Fiyat Teklifi Sunumu',
    description: 'Yarın saat 14:00\'da müşteriye detaylı fiyat teklifi sunulacak.',
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
    title: 'İlk Tasarım Konsepti',
    description: 'Müşteri briefine göre hazırlanan ilk tasarım konsepti yüklendi.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-07T16:20:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'high',
    data: {
      version: 'V1.0',
      files_count: 4
    }
  },
  {
    id: '5',
    type: 'messaging',
    title: 'Hızlı Soru-Cevap',
    description: 'Stand elektrik ihtiyaçları hakkında kısa mesaj trafiği.',
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    created_at: '2024-10-07T14:10:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'low',
    data: {
      message_count: 5,
      last_message: 'Elektrik bağlantısı için gerekli evrakları hazırlayacağız.'
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
  }
};

const STATUS_CONFIG = {
  completed: { label: 'Tamamlandı', icon: CheckCircle, color: 'text-green-600' },
  pending: { label: 'Bekliyor', icon: Clock, color: 'text-yellow-600' },
  overdue: { label: 'Gecikti', icon: AlertTriangle, color: 'text-red-600' },
  cancelled: { label: 'İptal', icon: XCircle, color: 'text-gray-600' }
};

const PRIORITY_CONFIG = {
  high: { label: 'Yüksek', color: 'text-red-600', bgColor: 'bg-red-100' },
  medium: { label: 'Orta', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  low: { label: 'Düşük', color: 'text-green-600', bgColor: 'bg-green-100' }
};

export default function OpportunityTimelineModal({ 
  isOpen, 
  onClose, 
  opportunityId, 
  opportunityTitle 
}) {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && opportunityId) {
      loadActivities();
    }
  }, [isOpen, opportunityId]);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, filterType, filterStatus, activities]);

  const loadActivities = () => {
    // In real implementation, this would fetch from API
    // For now, use sample data specific to this opportunity
    const sampleActivities = getSampleActivitiesForOpportunity(opportunityId, opportunityTitle);
    setActivities(sampleActivities);
  };

  const filterActivities = () => {
    let filtered = activities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      summary.byType[type] = activities.filter(a => a.type === type).length;
    });

    return summary;
  };

  const summary = getActivitySummary();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] bg-white shadow-2xl flex flex-col">
        
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center space-x-2">
                <Activity className="h-6 w-6" />
                <span>Aktivite Timeline</span>
              </CardTitle>
              <div className="mt-2 text-purple-100 text-sm">
                <p className="font-medium">{opportunityTitle}</p>
                <p className="text-xs opacity-75">Bu fırsata ait tüm aktiviteler ({activities.length} aktivite)</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-purple-600"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Rapor
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-purple-600 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-full flex">
            
            {/* Left Sidebar - Summary & Filters */}
            <div className="w-80 border-r border-gray-200 bg-gray-50 p-4 space-y-4">
              
              {/* Quick Stats */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Özet</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border text-center">
                    <p className="text-2xl font-bold text-purple-600">{summary.total}</p>
                    <p className="text-xs text-gray-600">Toplam</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border text-center">
                    <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
                    <p className="text-xs text-gray-600">Tamamlanan</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border text-center">
                    <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
                    <p className="text-xs text-gray-600">Bekleyen</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {activities.filter(a => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(a.created_at) > weekAgo;
                      }).length}
                    </p>
                    <p className="text-xs text-gray-600">Bu Hafta</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtreler</span>
                </h3>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Arama
                  </label>
                  <div className="relative">
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Aktivite ara..."
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tip
                  </label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Durum
                  </label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Activity Type Distribution */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>Dağılım</span>
                </h3>
                {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                  <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <config.icon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <span className="text-sm font-medium">{summary.byType[key] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Timeline */}
            <div className="flex-1 p-6">
              <div className="space-y-4 max-h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Aktivite Zaman Çizelgesi ({filteredActivities.length})
                  </h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Aktivite
                  </Button>
                </div>

                {filteredActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Bu fırsat için henüz aktivite bulunmuyor</p>
                  </div>
                ) : (
                  filteredActivities.map((activity, index) => {
                    const typeConfig = ACTIVITY_TYPES[activity.type];
                    const statusConfig = STATUS_CONFIG[activity.status];
                    const priorityConfig = PRIORITY_CONFIG[activity.priority];
                    
                    return (
                      <div key={activity.id} className="relative">
                        
                        {/* Timeline line */}
                        {index !== filteredActivities.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 z-0"></div>
                        )}
                        
                        {/* Activity item */}
                        <div className="flex space-x-4 relative z-10">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-12 h-12 ${typeConfig.bgColor} rounded-full flex items-center justify-center border-2 ${typeConfig.borderColor}`}>
                            <typeConfig.icon className={`h-5 w-5 ${typeConfig.color}`} />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                                    {priorityConfig.label}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className={`flex items-center space-x-1 ${statusConfig.color}`}>
                                  <statusConfig.icon className="h-4 w-4" />
                                  <span className="text-xs font-medium">{statusConfig.label}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{activity.created_by}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDate(activity.created_at)}</span>
                                </div>
                              </div>
                              <span className="text-gray-400">{getTimeAgo(activity.created_at)}</span>
                            </div>
                            
                            {/* Activity specific details */}
                            {activity.type === 'call_record' && (
                              <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                {activity.data.call_type === 'outgoing' ? 'Giden' : 'Gelen'} arama • 
                                {activity.data.duration_minutes} dakika • 
                                {activity.data.contact_person}
                              </div>
                            )}
                            
                            {activity.type === 'activity_planner' && activity.scheduled_for && (
                              <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Planlanan: {formatDate(activity.scheduled_for)}</span>
                              </div>
                            )}

                            {activity.type === 'design_upload' && (
                              <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                Versiyon {activity.data.version} • {activity.data.files_count} dosya
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}