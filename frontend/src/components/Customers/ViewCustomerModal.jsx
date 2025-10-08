import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  X,
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
  Briefcase
} from 'lucide-react';

export default function ViewCustomerModal({ customer, onClose, onEdit }) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Building2 className="h-7 w-7" />
                <span>Müşteri Detayları</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => onEdit && onEdit(customer)}
                  className="text-white hover:bg-white/20"
                >
                  Düzenle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-6">
                
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span>Temel Bilgiler</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Müşteri Adı</label>
                      <p className="text-base font-semibold text-gray-900">{customer.name || customer.fullName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Müşteri Türü</label>
                      <p className="text-base text-gray-900">{customer.customer_type || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Sektör</label>
                      <p className="text-base text-gray-900">{customer.sector || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">İş Türü</label>
                      <p className="text-base text-gray-900">{customer.relationshipType || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span>İletişim Bilgileri</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telefon</label>
                      <p className="text-base text-gray-900">{formatPhone(customer.phone)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">E-posta</label>
                      <p className="text-base text-gray-900">{customer.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Website</label>
                      <p className="text-base text-gray-900">{customer.website || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span>Adres Bilgileri</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ülke</label>
                      <p className="text-base text-gray-900">{customer.country || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Şehir</label>
                      <p className="text-base text-gray-900">{customer.city || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Adres</label>
                      <p className="text-base text-gray-900">{customer.address || '-'}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-6">

                {/* Authorized Persons */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Yetkili Kişiler</span>
                  </h3>
                  {customer.contact_persons && customer.contact_persons.length > 0 ? (
                    <div className="space-y-3">
                      {customer.contact_persons.map((contact, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border">
                          <div className="flex items-start space-x-3">
                            <User className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {contact.full_name || contact.name || 'İsimsiz'}
                              </p>
                              {contact.mobile && (
                                <p className="text-sm text-gray-600 flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{contact.mobile}</span>
                                </p>
                              )}
                              {contact.email && (
                                <p className="text-sm text-gray-600 flex items-center space-x-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{contact.email}</span>
                                </p>
                              )}
                              {contact.position && (
                                <p className="text-sm text-gray-600 flex items-center space-x-1">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{contact.position}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Yetkili kişi bilgisi bulunmuyor</p>
                  )}
                </div>

                {/* Financial Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span>Finansal Bilgiler</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vergi Numarası</label>
                      <p className="text-base text-gray-900">{customer.tax_number || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">IBAN</label>
                      <p className="text-base text-gray-900">{customer.iban || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Para Birimi</label>
                      <p className="text-base text-gray-900">{customer.currency || 'TRY'}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Tag className="h-5 w-5 text-orange-600" />
                      <span>Etiketler</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span>Notlar</span>
                  </h3>
                  <div className="bg-white p-3 rounded border min-h-[80px]">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {customer.notes || 'Not bulunmuyor.'}
                    </p>
                  </div>
                </div>

                {/* System Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <span>Sistem Bilgileri</span>
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Oluşturulma:</span>
                      <span className="text-sm text-gray-900">{formatDate(customer.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Son Güncelleme:</span>
                      <span className="text-sm text-gray-900">{formatDate(customer.updated_at)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}