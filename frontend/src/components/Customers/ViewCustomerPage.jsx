import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  ArrowLeft,
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  FileText,
  Tag,
  User,
  Globe,
  Calendar,
  DollarSign,
  CreditCard,
  Briefcase,
  Edit,
  Eye
} from 'lucide-react';
// Code to Label mapping
const CUSTOMER_TYPE_LABELS = {
  'ajans': 'Ajans',
  'firma': 'Firma',
  'bireysel': 'Bireysel',
  'vip_musteri': 'VIP Müşteri',
  'kurumsal': 'Kurumsal',
  'mevcut_musteri': 'Mevcut Müşteri',
  'yeni_musteri': 'Yeni Müşteri',
  'dernek_vakif': 'Dernek veya Vakıf',
  'devlet_kurumu': 'Devlet Kurumu',
  'holding_sirketi': 'Holding Şirketi',
  'vakif_sirketi': 'Vakıf Şirketi',
  'kuzen_irketi': 'Kuzen Şirketi',
  'kuzen_sirketi': 'Kuzen Şirketi'
};

const SECTOR_LABELS = {
  'teknoloji': 'Teknoloji',
  'finans': 'Finans',
  'saglik': 'Sağlık',
  'egitim': 'Eğitim',
  'insaat': 'İnşaat',
  'imalat': 'İmalat',
  'lojistik': 'Lojistik',
  'enerji': 'Enerji',
  'bankacilik': 'Bankacılık',
  'gida_icecek': 'Gıda-İçecek',
  'otomotiv': 'Otomotiv',
  'turizm': 'Turizm',
  'tekstil': 'Tekstil',
  'fuar_stand_irketi': 'Fuar Stand Şirketi',
  'fuar_stand_sirketi': 'Fuar Stand Şirketi',
  'yatirim_portfoy': 'Yatırım ve Portföy Yönetimi',
  'yatirim_ve_portfoy_yonetimi': 'Yatırım ve Portföy Yönetimi',
  'diger': 'Diğer'
};

export default function ViewCustomerPage({ customer, onBack, onEdit }) {
  if (!customer) return null;

  const formatPhone = (phone) => {
    if (!phone) return '-';
    return phone;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-white hover:bg-white/20 p-2 rounded-lg"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Eye className="h-7 w-7" />
                  </div>
                  <h1 className="text-3xl font-bold">Müşteri Detayları</h1>
                </div>
                <p className="mt-2 text-blue-100">
                  {customer.companyName || customer.name || customer.fullName} - Müşteri bilgilerini görüntüle
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => onEdit && onEdit(customer)}
              className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 font-semibold rounded-lg shadow-lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Basic Information */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <span>Temel Bilgiler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Müşteri Adı</label>
                    <p className="text-xl font-bold text-gray-900 mt-1">{customer.companyName || customer.name || customer.fullName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Firma Ünvanı</label>
                    <p className="text-base text-gray-700 mt-1">{customer.companyTitle || customer.company_title || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Müşteri Türü</label>
                    <p className="text-base text-gray-700 mt-1">
                      {CUSTOMER_TYPE_LABELS[customer.relationshipType] || 
                       customer.relationshipType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 
                       customer.customerType || 
                       customer.customer_type || 
                       '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sektör</label>
                    <p className="text-base text-gray-700 mt-1">
                      {SECTOR_LABELS[customer.sector] || 
                       customer.sector?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 
                       customer.specialty || 
                       '-'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Kaynak</label>
                      <p className="text-base text-gray-700 mt-1">{customer.source || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Durum</label>
                      <p className="text-base text-gray-700 mt-1">{customer.status || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Firma Bilgileri - Consolidated Company Information */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-green-600" />
                  <span>Firma Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* İletişim Bilgileri */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b pb-2 mb-4">İletişim</h3>
                    
                    {customer.phone && (
                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Telefon</label>
                          <p className="text-sm text-gray-900 font-medium">{formatPhone(customer.phone)}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.mobile && (
                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Cep Telefonu</label>
                          <p className="text-sm text-gray-900 font-medium">{formatPhone(customer.mobile)}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.email && (
                      <div className="flex items-start space-x-3">
                        <Mail className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">E-posta</label>
                          <p className="text-sm text-gray-900 font-medium break-all">{customer.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.website && (
                      <div className="flex items-start space-x-3">
                        <Globe className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Website</label>
                          <p className="text-sm text-blue-600 font-medium break-all hover:underline">
                            <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer">
                              {customer.website}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Adres Bilgileri */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b pb-2 mb-4">Adres</h3>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                      <div className="space-y-2">
                        {customer.address && (
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Adres</label>
                            <p className="text-sm text-gray-900">{customer.address}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {customer.city && (
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase">Şehir</label>
                              <p className="text-sm text-gray-900 font-medium">{customer.city}</p>
                            </div>
                          )}
                          {customer.country && (
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase">Ülke</label>
                              <p className="text-sm text-gray-900 font-medium">{customer.country}</p>
                            </div>
                          )}
                        </div>
                        
                        {customer.postalCode && (
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Posta Kodu</label>
                            <p className="text-sm text-gray-900">{customer.postalCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services and Products */}
            {customer.services && customer.services.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <Briefcase className="h-6 w-6 text-orange-600" />
                    <span>Ürün ve Servisler</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {customer.services.map((service, index) => (
                      <Badge key={index} className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200 px-3 py-1">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Information */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <CreditCard className="h-6 w-6 text-emerald-600" />
                  <span>Finansal Bilgiler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">VKN (Vergi Kimlik No)</label>
                    <p className="text-base text-gray-700 mt-1 font-mono">{customer.taxNumber || customer.tax_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Vergi Dairesi</label>
                    <p className="text-base text-gray-700 mt-1">{customer.taxOffice || customer.tax_office || '-'}</p>
                  </div>
                  {(customer.iban || customer.bankName || customer.bank_name) && (
                    <>
                      <div className="pt-2 border-t">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Banka Bilgileri</label>
                      </div>
                      {customer.bankName || customer.bank_name ? (
                        <div>
                          <label className="text-xs text-gray-500">Banka Adı</label>
                          <p className="text-base text-gray-700">{customer.bankName || customer.bank_name}</p>
                        </div>
                      ) : null}
                      {customer.iban && (
                        <div>
                          <label className="text-xs text-gray-500">IBAN</label>
                          <p className="text-base text-gray-700 font-mono">{customer.iban}</p>
                        </div>
                      )}
                      {(customer.accountHolderName || customer.account_holder_name) && (
                        <div>
                          <label className="text-xs text-gray-500">Hesap Sahibi</label>
                          <p className="text-base text-gray-700">{customer.accountHolderName || customer.account_holder_name}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Yetkili Kişiler - Yeni Temiz Tasarım */}
            {customer.contacts && customer.contacts.length > 0 ? customer.contacts.map((contact, index) => (
              <Card key={index} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-6 w-6 text-purple-600" />
                      <span>Yetkili Kişi #{index + 1}</span>
                    </div>
                    {contact.is_accounting_responsible && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        Muhasebe Sorumlusu
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* İsim ve Pozisyon */}
                  <div className="mb-6 pb-4 border-b">
                    <h3 className="text-lg font-bold text-gray-900">
                      {contact.fullName || contact.full_name || contact.name || '-'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {contact.position || contact.title || 'Pozisyon belirtilmemiş'}
                    </p>
                  </div>

                  {/* İki Sütun */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sol Sütun - İletişim */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b pb-2 mb-4">İletişim</h4>
                      
                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Cep Telefonu</label>
                          <p className="text-sm text-gray-900 font-medium">{contact.mobile || contact.phone || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Mail className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">E-posta</label>
                          <p className="text-sm text-gray-900 font-medium break-all">{contact.email || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-pink-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Doğum Günü</label>
                          <p className="text-sm text-gray-900 font-medium">{contact.birthday ? formatDate(contact.birthday) : '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-indigo-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Cinsiyet</label>
                          <p className="text-sm text-gray-900 font-medium">{contact.gender || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sağ Sütun - Adres */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b pb-2 mb-4">Adres ve Diğer</h4>
                      
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Adres</label>
                            <p className="text-sm text-gray-900">{contact.address || '-'}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase">Şehir</label>
                              <p className="text-sm text-gray-900 font-medium">{contact.city || '-'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase">Ülke</label>
                              <p className="text-sm text-gray-900 font-medium">{contact.country || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Briefcase className="h-5 w-5 text-teal-600 mt-1 flex-shrink-0" />
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Projede Rolü</label>
                          <p className="text-sm text-gray-900 font-medium">{contact.project_role || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Tag className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Etiketler</label>
                          {contact.tags && contact.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {contact.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} className="bg-blue-100 text-blue-800 text-xs border-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-900 font-medium">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Tags - Always show */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <Tag className="h-6 w-6 text-orange-600" />
                  <span>Etiketler {customer.tags && customer.tags.length > 0 && `(${customer.tags.length})`}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {customer.tags && customer.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {customer.tags.map((tag, index) => (
                      <Badge key={index} className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic text-center py-4">Etiket bulunmuyor</p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-gray-600" />
                  <span>Notlar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg border min-h-[120px]">
                  <p className="text-gray-700 text-base leading-relaxed">
                    {customer.notes || (
                      <span className="italic text-gray-500">Not bulunmuyor.</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  <span>Sistem Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Oluşturma Tarihi:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(customer.createdAt || customer.created_at)}</span>
                  </div>
                  {(customer.createdBy || customer.created_by) && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Oluşturan:</span>
                      <span className="text-sm font-medium text-gray-900">{customer.createdBy || customer.created_by}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-t pt-3">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Son Güncelleme:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(customer.updatedAt || customer.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}