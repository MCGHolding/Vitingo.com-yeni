import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Target, Building, TrendingUp, MapPin, FileText, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

// Enum değerleri
const OPPORTUNITY_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referans' },
  { value: 'cold_call', label: 'Soğuk Arama' },
  { value: 'trade_fair', label: 'Ticaret Fuarı' },
  { value: 'social_media', label: 'Sosyal Medya' },
  { value: 'email_campaign', label: 'E-posta Kampanyası' },
  { value: 'partner', label: 'İş Ortağı' },
  { value: 'other', label: 'Diğer' }
];

const OPPORTUNITY_STAGES = [
  { value: 'potential', label: 'Potansiyel Müşteri', order: 1 },
  { value: 'contacted', label: 'İletişim Kuruldu', order: 2 },
  { value: 'demo', label: 'Demo/Sunum', order: 3 },
  { value: 'proposal_sent', label: 'Teklif Hazırlandı', order: 4 },
  { value: 'negotiation', label: 'Pazarlık', order: 5 },
  { value: 'closing', label: 'Kapanış', order: 6 },
  { value: 'lead', label: 'Potansiyel Müşteri', order: 1 },
  { value: 'contact', label: 'İletişim Kuruldu', order: 2 },
  { value: 'proposal', label: 'Teklif Hazırlandı', order: 3 }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Düşük', color: 'gray' },
  { value: 'medium', label: 'Orta', color: 'blue' },
  { value: 'high', label: 'Yüksek', color: 'orange' },
  { value: 'urgent', label: 'Acil', color: 'red' }
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Açık', color: 'green' },
  { value: 'won', label: 'Kazanıldı', color: 'blue' },
  { value: 'lost', label: 'Kaybedildi', color: 'red' },
  { value: 'on_hold', label: 'Beklemede', color: 'yellow' },
  { value: 'qualified', label: 'Nitelikli', color: 'green' },
  { value: 'proposal', label: 'Teklif Aşamasında', color: 'blue' },
  { value: 'negotiation', label: 'Görüşme Aşamasında', color: 'orange' },
  { value: 'closed-won', label: 'Kazanıldı', color: 'blue' },
  { value: 'closed-lost', label: 'Kaybedildi', color: 'red' }
];

const CURRENCY_OPTIONS = [
  { value: 'TRY', label: 'Türk Lirası', symbol: '₺' },
  { value: 'USD', label: 'Amerikan Doları', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'İngiliz Sterlini', symbol: '£' }
];

const PROJECT_TYPES = [
  { value: 'stand_design', label: 'Stand Tasarım' },
  { value: 'stand_production', label: 'Stand Üretim' },
  { value: 'turnkey', label: 'Anahtar Teslim' },
  { value: 'rental', label: 'Kiralama' },
  { value: 'consultation', label: 'Danışmanlık' },
  { value: 'other', label: 'Diğer' }
];

export default function OpportunityDetailPage({ opportunityId, onBack, onEdit }) {
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunity();
    }
  }, [opportunityId]);

  const fetchOpportunity = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/opportunities/${opportunityId}`);
      
      if (!response.ok) throw new Error('Fırsat bulunamadı');
      
      const data = await response.json();
      setOpportunity(data);
    } catch (error) {
      console.error(error);
      if (onBack) onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      await fetch(`${backendUrl}/api/opportunities/${opportunityId}`, { method: 'DELETE' });
      if (onBack) onBack();
    } catch (error) {
      console.error(error);
    }
  };

  // Helper functions
  const formatCurrency = (amount, currency = 'TRY') => {
    const symbol = CURRENCY_OPTIONS.find(c => c.value === currency)?.symbol || currency;
    return `${symbol} ${new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getSourceLabel = (value) => OPPORTUNITY_SOURCES.find(s => s.value === value)?.label || value;
  const getStageLabel = (value) => OPPORTUNITY_STAGES.find(s => s.value === value)?.label || value;
  const getPriorityLabel = (value) => PRIORITY_OPTIONS.find(p => p.value === value)?.label || value;
  const getPriorityColor = (value) => PRIORITY_OPTIONS.find(p => p.value === value)?.color || 'gray';
  const getStatusLabel = (value) => STATUS_OPTIONS.find(s => s.value === value)?.label || value;
  const getStatusColor = (value) => STATUS_OPTIONS.find(s => s.value === value)?.color || 'gray';
  const getProjectTypeLabel = (value) => PROJECT_TYPES.find(p => p.value === value)?.label || value;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Satış fırsatı bulunamadı</p>
        <button onClick={onBack} className="text-green-600 hover:underline mt-2">
          ← Fırsatlara Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{opportunity.title}</h1>
                <p className="text-sm text-gray-500">
                  Oluşturulma: {formatDate(opportunity.created_at || opportunity.createdAt)}
                  {opportunity.assignedToName && ` • Atanan: ${opportunity.assignedToName}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => onEdit && onEdit(opportunity)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="outline"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ÖN İZLEME KARTI */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Müşteri</p>
              <p className="font-medium text-gray-800 flex items-center gap-1">
                <Building className="h-4 w-4" />
                {opportunity.customer || opportunity.customerName || opportunity.leadName || opportunity.lead || '-'}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Aşama</p>
              <p className="font-medium text-gray-800 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {getStageLabel(opportunity.stage)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Öncelik</p>
              <Badge className={`
                ${getPriorityColor(opportunity.priority) === 'red' ? 'bg-red-100 text-red-700' : ''}
                ${getPriorityColor(opportunity.priority) === 'orange' ? 'bg-orange-100 text-orange-700' : ''}
                ${getPriorityColor(opportunity.priority) === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                ${getPriorityColor(opportunity.priority) === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
              `}>
                <Target className="h-3 w-3 mr-1" />
                {getPriorityLabel(opportunity.priority)}
              </Badge>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Tutar</p>
              <p className="font-bold text-green-600 text-lg">
                {formatCurrency(opportunity.amount, opportunity.currency)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Beklenen Kapanış</p>
              <p className="font-medium text-gray-800 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(opportunity.expectedCloseDate || opportunity.close_date || opportunity.closeDate)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Durum</p>
              <Badge className={`
                ${getStatusColor(opportunity.status) === 'green' ? 'bg-green-100 text-green-700' : ''}
                ${getStatusColor(opportunity.status) === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                ${getStatusColor(opportunity.status) === 'red' ? 'bg-red-100 text-red-700' : ''}
                ${getStatusColor(opportunity.status) === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
              `}>
                {getStatusLabel(opportunity.status)}
              </Badge>
            </div>
            
          </div>
        </div>

        {/* TAB NAVİGASYON */}
        <div className="border-b mb-6">
          <nav className="flex gap-1">
            {[
              { id: 'details', label: '📋 Detaylar', count: null },
              { id: 'activities', label: '📊 Aktiviteler', count: 0 },
              { id: 'proposals', label: '📄 Teklifler', count: 0 },
              { id: 'files', label: '📁 Dosyalar', count: ((opportunity.design_files || opportunity.designFiles)?.length || 0) + ((opportunity.reference_files || opportunity.referenceFiles)?.length || 0) }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 font-medium text-sm border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB İÇERİĞİ - Detaylar */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            
            {/* Temel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Temel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs text-gray-500">Fırsat Başlığı</label>
                    <p className="font-medium text-gray-800 mt-1">{opportunity.title}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Müşteri</label>
                    <p className="font-medium text-gray-800 mt-1">
                      {opportunity.customer || opportunity.customerName || '-'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Müşteri Adayı</label>
                    <p className="font-medium text-gray-800 mt-1">
                      {opportunity.lead || opportunity.leadName || '-'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">İletişim Kişisi</label>
                    <p className="font-medium text-gray-800 mt-1">
                      {opportunity.contact_person || opportunity.contactPerson || '-'}
                      {(opportunity.contact_email || opportunity.contactEmail) && (
                        <span className="text-gray-500 text-sm ml-2">({opportunity.contact_email || opportunity.contactEmail})</span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Fırsat Kaynağı</label>
                    <p className="font-medium text-gray-800 mt-1">{getSourceLabel(opportunity.source)}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Proje Türü</label>
                    <p className="font-medium text-gray-800 mt-1">{getProjectTypeLabel(opportunity.project_type || opportunity.projectType)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finansal Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Finansal Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-xs text-gray-500">Tutar</label>
                    <p className="font-bold text-xl text-green-600 mt-1">
                      {formatCurrency(opportunity.amount, opportunity.currency)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Para Birimi</label>
                    <p className="font-medium text-gray-800 mt-1">
                      {CURRENCY_OPTIONS.find(c => c.value === opportunity.currency)?.label || opportunity.currency}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Olasılık</label>
                    <p className="font-medium text-gray-800 mt-1">%{opportunity.probability || 0}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Beklenen Gelir</label>
                    <p className="font-medium text-gray-800 mt-1">
                      {opportunity.expected_revenue || opportunity.expectedRevenue
                        ? formatCurrency(opportunity.expected_revenue || opportunity.expectedRevenue, opportunity.currency)
                        : formatCurrency((opportunity.amount || 0) * ((opportunity.probability || 0) / 100), opportunity.currency)
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Süreç Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Süreç Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-xs text-gray-500">Durum</label>
                    <p className="mt-1">
                      <Badge className={`
                        ${getStatusColor(opportunity.status) === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${getStatusColor(opportunity.status) === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${getStatusColor(opportunity.status) === 'red' ? 'bg-red-100 text-red-700' : ''}
                        ${getStatusColor(opportunity.status) === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                      `}>
                        {getStatusLabel(opportunity.status)}
                      </Badge>
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Aşama</label>
                    <p className="font-medium text-gray-800 mt-1">{getStageLabel(opportunity.stage)}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Öncelik</label>
                    <p className="mt-1">
                      <Badge className={`
                        ${getPriorityColor(opportunity.priority) === 'red' ? 'bg-red-100 text-red-700' : ''}
                        ${getPriorityColor(opportunity.priority) === 'orange' ? 'bg-orange-100 text-orange-700' : ''}
                        ${getPriorityColor(opportunity.priority) === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${getPriorityColor(opportunity.priority) === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {getPriorityLabel(opportunity.priority)}
                      </Badge>
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Beklenen Kapanış Tarihi</label>
                    <p className="font-medium text-gray-800 mt-1">{formatDate(opportunity.expectedCloseDate || opportunity.close_date || opportunity.closeDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lokasyon ve Fuar Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Lokasyon ve Fuar Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs text-gray-500">Ülke</label>
                    <p className="font-medium text-gray-800 mt-1 flex items-center gap-2">
                      {opportunity.country || '-'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Şehir</label>
                    <p className="font-medium text-gray-800 mt-1">{opportunity.city || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Ticaret Fuarı</label>
                    <p className="font-medium text-gray-800 mt-1">
                      {opportunity.trade_show || opportunity.tradeShow || '-'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Fuar Başlama Tarihi</label>
                    <p className="font-medium text-gray-800 mt-1">{formatDate(opportunity.trade_show_start_date || opportunity.tradeShowStartDate)}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Fuar Bitiş Tarihi</label>
                    <p className="font-medium text-gray-800 mt-1">{formatDate(opportunity.trade_show_end_date || opportunity.tradeShowEndDate)}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Stand Büyüklüğü</label>
                    <p className="font-medium text-gray-800 mt-1">
                      {opportunity.stand_size || opportunity.standSize
                        ? `${opportunity.stand_size || opportunity.standSize} ${(opportunity.stand_size_unit || opportunity.standSizeUnit) === 'm2' ? 'm²' : 'sqft'}`
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detaylar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detaylar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">İş Türü</label>
                    <p className="font-medium text-gray-800 mt-1">{opportunity.business_type || opportunity.businessType || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Açıklama ve Notlar</label>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                      {opportunity.description || opportunity.notes || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
          </div>
        )}

        {/* Aktiviteler Tab */}
        {activeTab === 'activities' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Aktiviteler</h2>
                <Button className="bg-green-600 hover:bg-green-700">
                  + Aktivite Ekle
                </Button>
              </div>
              <p className="text-gray-500 text-center py-8">Henüz aktivite bulunmuyor</p>
            </CardContent>
          </Card>
        )}

        {/* Teklifler Tab */}
        {activeTab === 'proposals' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Teklifler</h2>
                <Button className="bg-green-600 hover:bg-green-700">
                  + Yeni Teklif
                </Button>
              </div>
              <p className="text-gray-500 text-center py-8">Henüz teklif bulunmuyor</p>
            </CardContent>
          </Card>
        )}

        {/* Dosyalar Tab */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📐 Tasarım Dosyaları</CardTitle>
              </CardHeader>
              <CardContent>
                {(opportunity.design_files || opportunity.designFiles)?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(opportunity.design_files || opportunity.designFiles).map(file => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="text-3xl mb-2">📄</div>
                        <p className="text-sm font-medium truncate">{file.originalName || file.original_name || file.filename}</p>
                        <p className="text-xs text-gray-500">{((file.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Tasarım dosyası bulunmuyor</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🖼️ Örnek Resim ve Videolar</CardTitle>
              </CardHeader>
              <CardContent>
                {(opportunity.reference_files || opportunity.referenceFiles)?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(opportunity.reference_files || opportunity.referenceFiles).map(file => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {file.thumbnailUrl || file.thumbnail_url ? (
                          <img src={file.thumbnailUrl || file.thumbnail_url} alt="" className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-3xl">
                            {(file.mimeType || file.mime_type)?.includes('video') ? '🎬' : '📄'}
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{file.originalName || file.original_name || file.filename}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Referans dosyası bulunmuyor</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* SİLME MODALI */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Satış Fırsatını Sil</h3>
            <p className="text-gray-600 mb-6">
              "{opportunity.title}" satış fırsatını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                İptal
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
