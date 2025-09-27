import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import EditSupplierModal from './EditSupplierModal';
import ViewSupplierModal from './ViewSupplierModal';
import { 
  Building2, 
  Phone, 
  Mail, 
  Tag,
  Plus,
  ArrowLeft,
  Eye,
  Edit,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  User,
  Trash2,
  UserX,
  Star,
  Ban,
  MessageSquare
} from 'lucide-react';

const AllSuppliersPage = ({ onBackToDashboard, onNewSupplier }) => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierContacts, setSupplierContacts] = useState({});
  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showViewModal, setShowViewModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Load suppliers, categories, and specialties in parallel
      const [suppliersRes, categoriesRes] = await Promise.all([
        fetch(`${backendUrl}/api/suppliers`),
        fetch(`${backendUrl}/api/supplier-categories`)
      ]);

      if (suppliersRes.ok && categoriesRes.ok) {
        const [suppliersData, categoriesData] = await Promise.all([
          suppliersRes.json(),
          categoriesRes.json()
        ]);

        setSuppliers(suppliersData);
        setCategories(categoriesData);

        // Load specialties for all categories
        const specialtiesPromises = categoriesData.map(cat => 
          fetch(`${backendUrl}/api/supplier-specialties/${cat.id}`).then(res => res.json())
        );
        const specialtiesResults = await Promise.all(specialtiesPromises);
        
        const specialtiesMap = {};
        specialtiesResults.forEach(specList => {
          specList.forEach(spec => {
            specialtiesMap[spec.id] = spec;
          });
        });
        setSpecialties(specialtiesMap);

      } else {
        throw new Error('Failed to load data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupplierContacts = async (supplierId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/supplier-contacts/${supplierId}`);
      
      if (response.ok) {
        const contacts = await response.json();
        setSupplierContacts(prev => ({
          ...prev,
          [supplierId]: contacts
        }));
      }
    } catch (error) {
      console.error('Error loading supplier contacts:', error);
    }
  };

  const handleExpandSupplier = async (supplierId) => {
    if (expandedSupplier === supplierId) {
      setExpandedSupplier(null);
    } else {
      setExpandedSupplier(supplierId);
      
      // Load contacts if not already loaded
      if (!supplierContacts[supplierId]) {
        await loadSupplierContacts(supplierId);
      }
    }
  };

  const handleViewSupplier = (supplier) => {
    setShowViewModal(supplier);
  };

  const handleEditSupplier = (supplier) => {
    setShowEditModal(supplier);
  };

  const handleEditSave = () => {
    // Reload data after edit
    loadData();
    setShowEditModal(null);
  };

  const handleSetPassive = async (supplierId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'passive' })
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Tedarikçi pasif duruma alındı",
          variant: "default"
        });
        await loadData();
      } else {
        throw new Error('Failed to set supplier passive');
      }
    } catch (error) {
      console.error('Error setting supplier passive:', error);
      toast({
        title: "Hata",
        description: "Tedarikçi pasif duruma alınırken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setShowActionMenu(null);
    }
  };

  const handleContactMail = (contact, supplier) => {
    // For now, we'll use mailto: link. Later this can be replaced with a proper mail modal
    const subject = `İletişim: ${supplier.company_short_name} - ${contact.full_name}`;
    const body = `Merhaba ${contact.full_name},\n\n${supplier.company_short_name} ile ilgili görüşmek istiyorum.\n\nSaygılarımla,`;
    const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Mail",
      description: "Email istemciniz açıldı",
      variant: "default"
    });
  };

  const handleContactMessage = (contact, supplier) => {
    toast({
      title: "Özellik",
      description: "Mesajlaşma özelliği yakında aktif olacak",
      variant: "default"
    });
  };

  const handleSetBlacklist = async (supplierId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'blacklist' })
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Tedarikçi kara listeye alındı",
          variant: "default"
        });
        await loadData();
      } else {
        throw new Error('Failed to blacklist supplier');
      }
    } catch (error) {
      console.error('Error blacklisting supplier:', error);
      toast({
        title: "Hata",
        description: "Tedarikçi kara listeye alınırken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setShowActionMenu(null);
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/suppliers/${supplierId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Başarılı",
          description: result.message,
          variant: "default"
        });

        // Reload suppliers
        await loadData();
      } else {
        throw new Error('Failed to delete supplier');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Hata",
        description: "Tedarikçi silinirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setShowDeleteModal(null);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Bilinmiyor';
  };

  const getSpecialtyName = (specialtyId) => {
    return specialties[specialtyId]?.name || 'Bilinmiyor';
  };

  const getStatusBadgeColor = (status) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Tedarikçiler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tüm Tedarikçiler</h1>
            <p className="text-gray-600">{suppliers.length} tedarikçi bulundu</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onBackToDashboard} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
          <Button onClick={onNewSupplier} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Yeni Tedarikçi</span>
          </Button>
        </div>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tedarikçiler Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz tedarikçi bulunmuyor.</p>
              <Button onClick={onNewSupplier} className="mt-4">
                İlk Tedarikçiyi Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded-lg overflow-hidden">
                  {/* Main Supplier Row */}
                  <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Expansion Button */}
                        <button
                          onClick={() => handleExpandSupplier(supplier.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedSupplier === supplier.id ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>

                        {/* Company Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 
                              className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                              title={supplier.company_title}
                            >
                              {supplier.company_short_name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(supplier.status)}`}>
                              {getStatusText(supplier.status)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            {supplier.phone && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {supplier.phone}
                              </span>
                            )}
                            {supplier.email && (
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {supplier.email}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Category & Specialty */}
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">
                            {getCategoryName(supplier.supplier_type_id)}
                          </div>
                          <div className="text-gray-500">
                            {getSpecialtyName(supplier.specialty_id)}
                          </div>
                        </div>

                        {/* Services Tags */}
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {supplier.services.slice(0, 2).map((service, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            >
                              {service}
                            </span>
                          ))}
                          {supplier.services.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{supplier.services.length - 2}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewSupplier(supplier)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditSupplier(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowActionMenu(
                              showActionMenu === supplier.id ? null : supplier.id
                            )}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>

                          {/* Action Menu Dropdown */}
                          {showActionMenu === supplier.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setShowDeleteModal(supplier);
                                    setShowActionMenu(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Sil
                                </button>
                                <button
                                  onClick={() => handleSetPassive(supplier.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 flex items-center"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Pasif
                                </button>
                                <button
                                  onClick={() => {
                                    setShowActionMenu(null);
                                    toast({
                                      title: "Özellik",
                                      description: "Puanlama özelliği yakında aktif olacak",
                                      variant: "default"
                                    });
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center"
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Puan
                                </button>
                                <button
                                  onClick={() => handleSetBlacklist(supplier.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Kara Liste
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Contacts Section */}
                  {expandedSupplier === supplier.id && (
                    <div className="border-t bg-gray-50">
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Yetkili Kişiler ({supplierContacts[supplier.id]?.length || 0})
                        </h4>
                        
                        {supplierContacts[supplier.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {supplierContacts[supplier.id].map((contact) => (
                              <div key={contact.id} className="bg-white rounded-lg p-3 border">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <h5 className="font-medium text-gray-900">{contact.full_name}</h5>
                                      {contact.position && (
                                        <span className="text-sm text-gray-500">- {contact.position}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                      {contact.mobile && (
                                        <span className="flex items-center">
                                          <Phone className="h-3 w-3 mr-1" />
                                          {contact.mobile}
                                        </span>
                                      )}
                                      {contact.email && (
                                        <span className="flex items-center">
                                          <Mail className="h-3 w-3 mr-1" />
                                          {contact.email}
                                        </span>
                                      )}
                                    </div>
                                    {/* Contact Tags */}
                                    {contact.tags && contact.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {contact.tags.map((tag, index) => (
                                          <span
                                            key={index}
                                            className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Contact Action Buttons */}
                                  <div className="flex items-center space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handleViewSupplier(supplier)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleEditSupplier(supplier)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Bu tedarikçiye ait yetkili kişi bulunmuyor.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Supplier Modal */}
      {showViewModal && (
        <ViewSupplierModal 
          supplier={showViewModal}
          onClose={() => setShowViewModal(null)}
          onEdit={(supplier) => {
            setShowViewModal(null);
            setShowEditModal(supplier);
          }}
        />
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && (
        <EditSupplierModal 
          supplier={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tedarikçi Sil</h3>
            <p className="text-gray-600 mb-6">
              <strong>{showDeleteModal.company_short_name}</strong> tedarikçisini silmek istediğinizden emin misiniz?
              {supplierContacts[showDeleteModal.id]?.length > 0 && (
                <span className="block mt-2 text-amber-600 text-sm">
                  ⚠️ Bu tedarikçiye bağlı yetkili kişiler var. Silme yerine pasif duruma alınacaktır.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                İptal
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteSupplier(showDeleteModal.id)}
              >
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSuppliersPage;