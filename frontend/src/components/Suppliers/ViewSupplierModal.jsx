import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Building2, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Tag,
  X,
  User,
  Calendar,
  Clock,
  Badge
} from 'lucide-react';

const ViewSupplierModal = ({ supplier, onClose, onEdit }) => {
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (supplier) {
      loadData();
    }
  }, [supplier]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Load contacts, categories, and specialties
      const [contactsRes, categoriesRes] = await Promise.all([
        fetch(`${backendUrl}/api/supplier-contacts/${supplier.id}`),
        fetch(`${backendUrl}/api/supplier-categories`)
      ]);

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);

        // Load specialties for current category
        if (supplier.supplier_type_id) {
          const specialtiesRes = await fetch(`${backendUrl}/api/supplier-specialties/${supplier.supplier_type_id}`);
          if (specialtiesRes.ok) {
            const specialtiesData = await specialtiesRes.json();
            setSpecialties(specialtiesData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading supplier details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Bilinmiyor';
  };

  const getSpecialtyName = (specialtyId) => {
    const specialty = specialties.find(spec => spec.id === specialtyId);
    return specialty ? specialty.name : 'Bilinmiyor';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'passive': return 'bg-yellow-100 text-yellow-800';
      case 'blacklist': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'passive': return 'Pasif';
      case 'blacklist': return 'Kara Liste';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!supplier) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tedarikçi Detayları</h1>
              <p className="text-gray-600">{supplier.company_short_name} bilgilerini görüntüleyin</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onEdit && onEdit(supplier)}>
              Düzenle
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Yükleniyor...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Temel Bilgiler</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(supplier.status)}`}>
                    {getStatusText(supplier.status)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Firma Kısa Adı</label>
                      <p className="text-gray-900 font-medium">{supplier.company_short_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Firma Ünvanı</label>
                      <p className="text-gray-900">{supplier.company_title || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Adres</label>
                      <p className="text-gray-900">{supplier.address || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Kategori</label>
                      <p className="text-gray-900 font-medium">{getCategoryName(supplier.supplier_type_id)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Uzmanlık Alanı</label>
                      <p className="text-gray-900">{getSpecialtyName(supplier.specialty_id)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Kayıt Tarihi</label>
                      <p className="text-gray-900">{formatDate(supplier.created_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>İletişim Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {supplier.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Telefon</label>
                        <p className="text-gray-900">{supplier.phone}</p>
                      </div>
                    </div>
                  )}
                  {supplier.mobile && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cep Telefonu</label>
                        <p className="text-gray-900">{supplier.mobile}</p>
                      </div>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{supplier.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tax Info */}
            {(supplier.tax_office || supplier.tax_number) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Vergi Bilgileri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {supplier.tax_office && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Vergi Dairesi</label>
                        <p className="text-gray-900">{supplier.tax_office}</p>
                      </div>
                    )}
                    {supplier.tax_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">VKN</label>
                        <p className="text-gray-900">{supplier.tax_number}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {supplier.services && supplier.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Hizmetler</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {supplier.services.map((service, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Yetkili Kişiler ({contacts.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="p-2 bg-gray-100 rounded-full">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{contact.full_name}</h4>
                                {contact.position && (
                                  <p className="text-sm text-gray-500">{contact.position}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              {contact.mobile && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">{contact.mobile}</span>
                                </div>
                              )}
                              {contact.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">{contact.email}</span>
                                </div>
                              )}
                            </div>

                            {contact.tags && contact.tags.length > 0 && (
                              <div className="mt-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Etiketler</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {contact.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {contact.notes && (
                              <div className="mt-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notlar</label>
                                <p className="text-sm text-gray-900 mt-1">{contact.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Bu tedarikçiye ait yetkili kişi bulunmuyor.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Kayıt Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                    <p className="text-gray-900">{formatDate(supplier.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Son Güncelleme</label>
                    <p className="text-gray-900">{formatDate(supplier.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSupplierModal;