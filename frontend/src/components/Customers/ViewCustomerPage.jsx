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
                    <p className="text-base text-gray-700 mt-1">{customer.customerType || customer.customer_type || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sektör</label>
                    <p className="text-base text-gray-700 mt-1">{customer.sector || customer.specialty || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <Phone className="h-6 w-6 text-green-600" />
                  <span>İletişim Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Telefon</label>
                      <p className="text-base text-gray-700">{formatPhone(customer.phone)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">E-posta</label>
                      <p className="text-base text-gray-700">{customer.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Website</label>
                      <p className="text-base text-gray-700">{customer.website || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <MapPin className="h-6 w-6 text-red-600" />
                  <span>Adres Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ülke</label>
                    <p className="text-base text-gray-700 mt-1">{customer.country || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Şehir</label>
                    <p className="text-base text-gray-700 mt-1">{customer.city || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Adres</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-base text-gray-700 leading-relaxed">
                        {customer.address || 'Adres bilgisi bulunmuyor.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Vergi Numarası</label>
                    <p className="text-base text-gray-700 mt-1 font-mono">{customer.taxNumber || customer.tax_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">IBAN</label>
                    <p className="text-base text-gray-700 mt-1 font-mono">{customer.iban || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Para Birimi</label>
                    <Badge className="mt-1 bg-emerald-100 text-emerald-800">
                      {customer.currency || 'TRY'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Authorized Persons */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <Users className="h-6 w-6 text-purple-600" />
                  <span>İletişim Kişisi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {customer.contactPerson ? (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border hover:shadow-md transition-all duration-200">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">
                          {customer.contactPerson}
                        </p>
                        {customer.phone && (
                          <p className="text-sm text-gray-600 flex items-center space-x-2 mt-1">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span>{customer.phone}</span>
                          </p>
                        )}
                        {customer.email && (
                          <p className="text-sm text-gray-600 flex items-center space-x-2 mt-1">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <span>{customer.email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-base">İletişim kişisi bilgisi bulunmuyor</p>
                    <p className="text-sm mt-1">Bu müşteri için henüz iletişim kişisi eklenmemiş</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {customer.tags && customer.tags.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <Tag className="h-6 w-6 text-orange-600" />
                    <span>Etiketler ({customer.tags.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    {customer.tags.map((tag, index) => (
                      <Badge key={index} className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Oluşturulma:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(customer.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Son Güncelleme:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(customer.updated_at)}</span>
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