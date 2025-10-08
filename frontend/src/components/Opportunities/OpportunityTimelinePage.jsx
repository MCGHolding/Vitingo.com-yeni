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
  ArrowLeft,
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

export default function OpportunityTimelinePage({ 
  onBack, 
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
    if (opportunityId) {
      loadActivities();
    }
  }, [opportunityId]);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, filterType, filterStatus, activities]);

  const loadActivities = () => {
    setLoading(true);
    // In real implementation, this would fetch from API
    // For now, use sample data specific to this opportunity
    setTimeout(() => {
      const sampleActivities = getSampleActivitiesForOpportunity(opportunityId, opportunityTitle);
      setActivities(sampleActivities);
      setLoading(false);
    }, 500);
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
      summary.byType[type] = activities.filter(a => a.type === type).length;
    });

    return summary;
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
            <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 h-9">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Yeni
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        
        {/* Compact Modern Summary Cards */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Toplam</p>
                <p className="text-lg font-bold text-gray-900">{summary.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Tamamlanan</p>
                <p className="text-lg font-bold text-gray-900">{summary.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-amber-200/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Bekleyen</p>
                <p className="text-lg font-bold text-gray-900">{summary.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-blue-200/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Bu Hafta</p>
                <p className="text-lg font-bold text-gray-900">
                  {activities.filter(a => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(a.created_at) > weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-indigo-200/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Hatırlatıcı</p>
                <p className="text-lg font-bold text-gray-900">
                  {activities.filter(a => a.status === 'pending' && a.scheduled_for).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Compact Filters Sidebar */}
          <div className="space-y-3">
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span>Filtreler</span>
                </h3>
              </div>
              <div className="p-3 space-y-3">
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
                  <div key={key} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      <config.icon className={`h-3.5 w-3.5 ${config.color}`} />
                      <span className="text-xs text-gray-700">{config.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {summary.byType[key] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compact Modern Timeline */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Zaman Çizelgesi ({filteredActivities.length})
                </h3>
                <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                  <Bell className="h-3 w-3 mr-1.5" />
                  Hatırlatıcılar
                </Button>
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
                        const typeConfig = ACTIVITY_TYPES[activity.type];
                        const statusConfig = STATUS_CONFIG[activity.status];
                        const priorityConfig = PRIORITY_CONFIG[activity.priority];
                        
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}