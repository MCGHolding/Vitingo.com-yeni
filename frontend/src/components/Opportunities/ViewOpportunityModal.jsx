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

        <CardContent className="p-8 bg-gradient-to-br from-slate-50 to-gray-50">
          <div className="space-y-8">
            
            {/* TEMEl BİLGİLER */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-b border-blue-100/50">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Temel Bilgiler
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="group">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fırsat No</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {opportunity.displayIndex || '#' + opportunity.id}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Müşteri</label>
                      <p className="font-bold text-gray-800 text-lg mt-1">{opportunity.customer}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Satış Fırsatı Adı</label>
                      <p className="font-semibold text-gray-700 text-base mt-1">{opportunity.eventName || opportunity.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fırsat Kaynağı</label>
                      <p className="text-gray-600 text-base mt-1">{opportunity.source || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Proje Türü</label>
                      <p className="text-gray-600 text-base mt-1">{opportunity.project_type || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">İş Türü</label>
                      <p className="text-gray-600 text-base mt-1">{opportunity.business_type || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ülke</label>
                      <p className="text-gray-600 text-base mt-1">{opportunity.country || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Şehir</label>
                      <p className="text-gray-600 text-base mt-1">{opportunity.city || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SÜREÇ BİLGİLERİ */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-100/50">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                    Süreç Bilgileri
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Durum</label>
                      <div className="mt-2">
                        <Badge className={`${getStatusColor(opportunity.statusText)} border-0 px-4 py-2 text-sm font-medium shadow-lg`}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {opportunity.statusText}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Aşama</label>
                      <p className="text-gray-700 text-base font-medium mt-1">{opportunity.stage || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Kullanıcı Adı Soyadı</label>
                      <div className="flex items-center space-x-3 mt-2">
                        <Avatar className="h-10 w-10 shadow-lg border-2 border-white">
                          <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold">
                            {(opportunity.contactPerson || 'NN').split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-bold text-gray-800 text-base">{opportunity.contactPerson || opportunity.contact_person || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Başarı Olasılığı</label>
                      <div className="mt-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-3 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full shadow-sm transition-all duration-500" 
                              style={{width: `${opportunity.probability || 50}%`}}
                            ></div>
                          </div>
                          <span className="text-lg font-bold text-emerald-600">{opportunity.probability || 50}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Son Güncelleme</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-600 text-base">{formatDate(opportunity.updated_at || opportunity.lastUpdate)}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Oluşturulma Tarihi</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-600 text-base">{formatDate(opportunity.created_at || opportunity.lastUpdate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LOKASYON VE FUAR BİLGİLERİ */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-b border-purple-100/50">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shadow-lg">
                    <LocationIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
                    Lokasyon ve Fuar Bilgileri
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ticaret Fuarı</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <EventIcon className="h-4 w-4 text-purple-500" />
                        <p className="text-gray-700 text-base font-medium">{opportunity.trade_show || opportunity.tradeShow || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Başlama Tarihi</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <p className="text-gray-600 text-base">{opportunity.trade_show_start_date ? formatDate(opportunity.trade_show_start_date) : '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Bitiş Tarihi</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4 text-red-500" />
                        <p className="text-gray-600 text-base">{opportunity.trade_show_end_date ? formatDate(opportunity.trade_show_end_date) : '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Stand Büyüklüğü</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Package className="h-4 w-4 text-blue-500" />
                        <p className="text-gray-600 text-base font-medium">
                          {opportunity.stand_size ? `${opportunity.stand_size} ${opportunity.stand_size_unit || 'm²'}` : '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fuar Ülkesi</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Globe className="h-4 w-4 text-orange-500" />
                        <p className="text-gray-600 text-base">{opportunity.country || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fuar Şehri</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="h-4 w-4 text-indigo-500" />
                        <p className="text-gray-600 text-base">{opportunity.city || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FİNANSAL BİLGİLER */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-emerald-100/50">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
                    Finansal Bilgiler
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border border-emerald-100">
                      <label className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Öngörülen Gelir</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <BarChart3 className="h-5 w-5 text-emerald-500" />
                        <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                          {formatCurrency(opportunity.amount || opportunity.expected_revenue || 0, opportunity.currency)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Para Birimi</label>
                      <p className="text-gray-700 text-base font-medium mt-1">{opportunity.currency || 'TRY'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Başarı Olasılığı</label>
                      <div className="mt-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-4 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-green-500 h-4 rounded-full shadow-sm transition-all duration-500 relative" 
                              style={{width: `${opportunity.probability || 50}%`}}
                            >
                              <div className="absolute right-0 top-0 h-4 w-4 bg-white rounded-full shadow-md transform translate-x-1/2"></div>
                            </div>
                          </div>
                          <span className="text-xl font-bold text-emerald-600">{opportunity.probability || 50}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
                      <label className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Beklenen Gelir</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {formatCurrency((opportunity.amount || 0) * (opportunity.probability || 50) / 100, opportunity.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DETAYLAR */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-100/50">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">
                    Proje Bilgileri
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Açıklama */}
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Açıklama ve Notlar</label>
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-4 min-h-[80px] shadow-inner">
                      <p className="text-gray-700 text-base leading-relaxed">
                        {opportunity.description || (
                          <span className="italic text-gray-500">Açıklama eklenmemiş.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Dosyalar */}
                  {((opportunity.design_files && opportunity.design_files.length > 0) || 
                    (opportunity.sample_files && opportunity.sample_files.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tasarım Dosyaları */}
                      {opportunity.design_files && opportunity.design_files.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-5 rounded-xl border border-purple-100">
                          <div className="flex items-center space-x-2 mb-4">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <label className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Tasarım Dosyaları</label>
                          </div>
                          <div className="space-y-3">
                            {opportunity.design_files.map((fileId, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-all duration-200">
                                <span className="text-sm font-medium text-gray-700">Dosya {index + 1}</span>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-purple-100 rounded-full">
                                    <Eye className="h-4 w-4 text-purple-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-purple-100 rounded-full">
                                    <Download className="h-4 w-4 text-purple-600" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Örnek Dosyalar */}
                      {opportunity.sample_files && opportunity.sample_files.length > 0 && (
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100">
                          <div className="flex items-center space-x-2 mb-4">
                            <Package className="h-5 w-5 text-orange-600" />
                            <label className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Örnek Resim ve Videolar</label>
                          </div>
                          <div className="space-y-3">
                            {opportunity.sample_files.map((fileId, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200">
                                <span className="text-sm font-medium text-gray-700">Dosya {index + 1}</span>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-100 rounded-full">
                                    <Eye className="h-4 w-4 text-orange-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-100 rounded-full">
                                    <Download className="h-4 w-4 text-orange-600" />
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
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-orange-100/50">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                      Etiketler
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    {opportunity.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className={`text-sm px-4 py-2 font-medium shadow-lg border-0 rounded-full hover:scale-105 transition-transform duration-200 ${tagColors[tag] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'}`}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center space-x-4 pt-8">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-8 py-3 text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-xl shadow-md"
              >
                <X className="h-4 w-4 mr-2" />
                Kapat
              </Button>
              <Button
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl transform hover:scale-105"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}