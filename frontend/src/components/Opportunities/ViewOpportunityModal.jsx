import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  X, 
  User, 
  DollarSign, 
  Calendar, 
  MapPin,
  FileText,
  Target,
  Globe,
  Building2,
  Briefcase,
  TrendingUp,
  Clock,
  Percent,
  Phone,
  Mail,
  MapPin as LocationIcon,
  Package,
  Calendar as EventIcon,
  Info,
  Eye,
  Download,
  Star,
  CheckCircle,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function ViewOpportunityModal({ opportunity, onClose }) {
  if (!opportunity) return null;

  const formatCurrency = (amount, currency) => {
    if (amount === 0) return '-';
    
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'TRY': '₺'
    };

    return `${symbols[currency] || currency} ${amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (statusText) => {
    if (statusText.includes('Teklif Bekleniyor')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (statusText.includes('Teklif Gönderildi')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (statusText.includes('Tasarım')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (statusText.includes('Brief')) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const tagColors = {
    'ALMANYA': 'bg-red-500 text-white',
    'DÜSSELDORF': 'bg-purple-500 text-white',
    'MEDICA': 'bg-teal-500 text-white',
    'BAE': 'bg-red-500 text-white',
    'DUBAİ': 'bg-orange-500 text-white',
    'GULFOOD': 'bg-teal-500 text-white',
    'TÜRKİYE': 'bg-red-500 text-white',
    'İSTANBUL': 'bg-purple-500 text-white'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl border-0 bg-white/95 backdrop-blur-md">
        <CardHeader className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <CardTitle className="text-2xl font-bold flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-7 w-7" />
              </div>
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Satış Fırsatı Detayları
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200 rounded-lg p-2"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-8">
            
            {/* TEMEl BİLGİLER */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span>Temel Bilgiler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fırsat No</label>
                      <p className="text-lg font-bold text-blue-600">{opportunity.displayIndex || '#' + opportunity.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Müşteri</label>
                      <p className="font-semibold text-gray-900">{opportunity.customer}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Satış Fırsatı Adı</label>
                      <p className="font-medium text-gray-900">{opportunity.eventName || opportunity.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fırsat Kaynağı</label>
                      <p className="text-gray-900">{opportunity.source || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Proje Türü</label>
                      <p className="text-gray-900">{opportunity.project_type || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">İş Türü</label>
                      <p className="text-gray-900">{opportunity.business_type || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ülke</label>
                      <p className="text-gray-900">{opportunity.country || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Şehir</label>
                      <p className="text-gray-900">{opportunity.city || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SÜREÇ BİLGİLERİ */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Süreç Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Durum</label>
                      <div>
                        <Badge className={`${getStatusColor(opportunity.statusText)} border px-3 py-1`}>
                          {opportunity.statusText}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Aşama</label>
                      <p className="text-gray-900">{opportunity.stage || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Kullanıcı Adı Soyadı</label>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                            {(opportunity.contactPerson || 'NN').split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-gray-900">{opportunity.contactPerson || opportunity.contact_person || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Başarı Olasılığı</label>
                      <p className="text-gray-900">{opportunity.probability || 50}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Son Güncelleme</label>
                      <p className="text-gray-900">{formatDate(opportunity.updated_at || opportunity.lastUpdate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Oluşturulma Tarihi</label>
                      <p className="text-gray-900">{formatDate(opportunity.created_at || opportunity.lastUpdate)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LOKASYON VE FUAR BİLGİLERİ */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <LocationIcon className="h-5 w-5 text-purple-600" />
                  <span>Lokasyon ve Fuar Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ticaret Fuarı</label>
                      <p className="text-gray-900">{opportunity.trade_show || opportunity.tradeShow || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Başlama Tarihi</label>
                      <p className="text-gray-900">{opportunity.trade_show_start_date ? formatDate(opportunity.trade_show_start_date) : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bitiş Tarihi</label>
                      <p className="text-gray-900">{opportunity.trade_show_end_date ? formatDate(opportunity.trade_show_end_date) : '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Stand Büyüklüğü</label>
                      <p className="text-gray-900">
                        {opportunity.stand_size ? `${opportunity.stand_size} ${opportunity.stand_size_unit || 'm²'}` : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fuar Ülkesi</label>
                      <p className="text-gray-900">{opportunity.country || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fuar Şehri</label>
                      <p className="text-gray-900">{opportunity.city || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FİNANSAL BİLGİLER */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Finansal Bilgiler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Öngörülen Gelir</label>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(opportunity.amount || opportunity.expected_revenue || 0, opportunity.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Para Birimi</label>
                      <p className="text-gray-900">{opportunity.currency || 'TRY'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Başarı Olasılığı</label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${opportunity.probability || 50}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{opportunity.probability || 50}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Beklenen Gelir</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency((opportunity.amount || 0) * (opportunity.probability || 50) / 100, opportunity.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DETAYLAR */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span>Proje Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Açıklama */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Açıklama ve Notlar</label>
                    <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-md min-h-[60px]">
                      {opportunity.description || 'Açıklama eklenmemiş.'}
                    </p>
                  </div>

                  {/* Dosyalar */}
                  {((opportunity.design_files && opportunity.design_files.length > 0) || 
                    (opportunity.sample_files && opportunity.sample_files.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tasarım Dosyaları */}
                      {opportunity.design_files && opportunity.design_files.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">Tasarım Dosyaları</label>
                          <div className="space-y-2">
                            {opportunity.design_files.map((fileId, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <span className="text-sm text-gray-700">Dosya {index + 1}</span>
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Örnek Dosyalar */}
                      {opportunity.sample_files && opportunity.sample_files.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">Örnek Resim ve Videolar</label>
                          <div className="space-y-2">
                            {opportunity.sample_files.map((fileId, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <span className="text-sm text-gray-700">Dosya {index + 1}</span>
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ETİKETLER */}
            {opportunity.tags && opportunity.tags.length > 0 && (
              <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    <span>Etiketler</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {opportunity.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className={`text-xs px-3 py-1 ${tagColors[tag] || 'bg-gray-500 text-white'} border-0`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Kapat
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6"
              >
                Düzenle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}