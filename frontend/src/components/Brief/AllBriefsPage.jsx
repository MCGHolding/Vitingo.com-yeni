import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building2,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  FileText
} from 'lucide-react';

export default function AllBriefsPage({ onBackToDashboard, onNewBrief }) {
  const [briefs, setBriefs] = useState([]);
  const [filteredBriefs, setFilteredBriefs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    // Load briefs from localStorage
    const loadBriefs = () => {
      const storedBriefs = JSON.parse(localStorage.getItem('briefs') || '[]');
      setBriefs(storedBriefs);
      setFilteredBriefs(storedBriefs);
    };

    loadBriefs();
  }, []);

  useEffect(() => {
    // Filter briefs based on search term, status, and priority
    let filtered = briefs;

    if (searchTerm) {
      filtered = filtered.filter(brief => 
        brief.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brief.clientCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brief.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brief.eventName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(brief => brief.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(brief => brief.priority === priorityFilter);
    }

    setFilteredBriefs(filtered);
  }, [searchTerm, statusFilter, priorityFilter, briefs]);

  const getStatusInfo = (status) => {
    const statusMap = {
      'active': { label: 'Aktif', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
      'in-progress': { label: 'Devam Ediyor', icon: Clock, color: 'bg-blue-100 text-blue-700' },
      'completed': { label: 'Tamamlandı', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
      'on-hold': { label: 'Beklemede', icon: Pause, color: 'bg-yellow-100 text-yellow-700' },
      'cancelled': { label: 'İptal Edildi', icon: XCircle, color: 'bg-red-100 text-red-700' },
      'draft': { label: 'Taslak', icon: FileText, color: 'bg-gray-100 text-gray-700' }
    };
    
    return statusMap[status] || statusMap['active'];
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      'low': { label: 'Düşük', color: 'bg-gray-100 text-gray-700' },
      'normal': { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
      'high': { label: 'Yüksek', color: 'bg-orange-100 text-orange-700' },
      'urgent': { label: 'Acil', color: 'bg-red-100 text-red-700' }
    };
    
    return priorityMap[priority] || priorityMap['normal'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const deleteBrief = (briefId) => {
    if (window.confirm('Bu brief\'i silmek istediğinizden emin misiniz?')) {
      const updatedBriefs = briefs.filter(brief => brief.id !== briefId);
      setBriefs(updatedBriefs);
      localStorage.setItem('briefs', JSON.stringify(updatedBriefs));
    }
  };

  const updateBriefStatus = (briefId, newStatus) => {
    const updatedBriefs = briefs.map(brief => 
      brief.id === briefId 
        ? { ...brief, status: newStatus, updatedAt: new Date().toISOString() }
        : brief
    );
    setBriefs(updatedBriefs);
    localStorage.setItem('briefs', JSON.stringify(updatedBriefs));
  };

  const getStats = () => {
    const total = briefs.length;
    const active = briefs.filter(b => b.status === 'active').length;
    const completed = briefs.filter(b => b.status === 'completed').length;
    const urgent = briefs.filter(b => b.priority === 'urgent').length;

    return { total, active, completed, urgent };
  };

  const stats = getStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBackToDashboard}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard'a Dön</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tüm Briefler</h1>
            <p className="text-gray-600 mt-1">Stand tasarımı brieflerini yönetin</p>
          </div>
        </div>
        
        <Button
          onClick={onNewBrief}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Brief</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Brief</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Acil</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Brief ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="in-progress">Devam Ediyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="on-hold">Beklemede</option>
              <option value="cancelled">İptal Edildi</option>
              <option value="draft">Taslak</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {filteredBriefs.length} brief bulundu
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Briefs List */}
      <div className="space-y-4">
        {filteredBriefs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz brief yok</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? 'Arama kriterlerine uygun brief bulunamadı'
                  : 'İlk brief\'inizi oluşturmak için "Yeni Brief" butonuna tıklayın'
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && priorityFilter === 'all') && (
                <Button
                  onClick={onNewBrief}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>İlk Brief'i Oluştur</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredBriefs.map(brief => {
            const statusInfo = getStatusInfo(brief.status);
            const priorityInfo = getPriorityInfo(brief.priority);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={brief.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {brief.projectName}
                            </h3>
                            <Badge className={priorityInfo.color}>
                              {priorityInfo.label}
                            </Badge>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4" />
                              <span>{brief.clientCompany}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{brief.contactPerson}</span>
                            </div>
                            
                            {brief.eventName && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span>{brief.eventName}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(brief.createdAt)}</span>
                            </div>
                          </div>
                          
                          {brief.standArea && (
                            <div className="mt-3 text-sm text-gray-600">
                              <span className="font-medium">Alan:</span> {brief.standArea} m²
                              {brief.standType && (
                                <span className="ml-4">
                                  <span className="font-medium">Tip:</span> {brief.standType}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {brief.deadline && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Son Teslim:</span> {formatDate(brief.deadline)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {brief.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBriefStatus(brief.id, 'in-progress')}
                        >
                          Başlat
                        </Button>
                      )}
                      
                      {brief.status === 'in-progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBriefStatus(brief.id, 'completed')}
                        >
                          Tamamla
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteBrief(brief.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}