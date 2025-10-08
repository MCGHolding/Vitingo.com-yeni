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
  PieChart
} from 'lucide-react';

// Sample activities data
const SAMPLE_ACTIVITIES = [
  {
    id: '1',
    type: 'call_record',
    title: 'Müşteri Görüşmesi - Ahmet Yılmaz',
    description: 'Stand tasarımı hakkında 15 dakikalık görüşme yapıldı.',
    opportunity_id: 'opp_123',
    opportunity_title: 'Düsseldorf Medica 2024',
    created_at: '2024-10-08T10:30:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'medium',
    data: {
      call_type: 'outgoing',
      duration_minutes: 15,
      contact_person: 'Ahmet Yılmaz',
      call_result: 'successful'
    }
  },
  {
    id: '2',
    type: 'email_reply',
    title: 'Fiyat Teklifi Yanıtı',
    description: 'Müşteriye detaylı fiyat teklifi gönderildi.',
    opportunity_id: 'opp_123',
    opportunity_title: 'Düsseldorf Medica 2024',
    created_at: '2024-10-08T09:15:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'high',
    data: {
      to: 'ahmet.yilmaz@ornekfirma.com',
      subject: 'Fiyat Teklifi - Stand Tasarımı'
    }
  },
  {
    id: '3',
    type: 'activity_planner',
    title: 'Teklif Gönderimi Hatırlatıcısı',
    description: 'Yarın saat 14:00\'da revize teklif gönderilecek.',
    opportunity_id: 'opp_456',
    opportunity_title: 'Dubai Gulfood 2025',
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
    title: 'Tasarım V1.2 Yüklendi',
    description: 'Müşteri geribildirimleri doğrultusunda revize edilmiş tasarım.',
    opportunity_id: 'opp_123',
    opportunity_title: 'Düsseldorf Medica 2024',
    created_at: '2024-10-07T16:20:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'medium',
    data: {
      version: 'V1.2',
      files_count: 3
    }
  },
  {
    id: '5',
    type: 'messaging',
    title: 'WhatsApp Mesajlaşması',
    description: 'Müşteri ile stand detayları hakkında mesajlaşma.',
    opportunity_id: 'opp_789',
    opportunity_title: 'İstanbul CNR Expo',
    created_at: '2024-10-07T14:10:00Z',
    created_by: 'Murat Bucak',
    status: 'completed',
    priority: 'low',
    data: {
      message_count: 8,
      last_message: 'Teşekkür ederim, değerlendirip dönüş yapacağım.'
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

export default function ActivityTimelinePage({ onBack }) {
  const [activities, setActivities] = useState(SAMPLE_ACTIVITIES);
  const [filteredActivities, setFilteredActivities] = useState(SAMPLE_ACTIVITIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, filterType, filterStatus, activities]);

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
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Geri Dön</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Activity className="h-8 w-8 text-indigo-600" />
                <span>Aktivite Takibi</span>
              </h1>
              <p className="text-gray-600">Tüm müşteri aktivitelerini takip edin</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapor Al
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Toplam Aktivite</p>
                  <p className="text-2xl font-bold text-blue-900">{summary.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Tamamlanan</p>
                  <p className="text-2xl font-bold text-green-900">{summary.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Bekleyen</p>
                  <p className="text-2xl font-bold text-yellow-900">{summary.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Bu Hafta</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {activities.filter(a => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(a.created_at) > weekAgo;
                    }).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filtreler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    Aktivite Tipi
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
              </CardContent>
            </Card>

            {/* Activity Type Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Tip Dağılımı</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <config.icon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <span className="text-sm font-medium">{summary.byType[key] || 0}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activities Timeline */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Aktivite Zaman Çizelgesi ({filteredActivities.length})
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4 mr-2" />
                    Hatırlatıcılar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {filteredActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Filtrelerinize uygun aktivite bulunamadı</p>
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
                                  <p className="text-xs text-blue-600 font-medium">{activity.opportunity_title}</p>
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
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}