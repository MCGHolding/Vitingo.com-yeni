import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '../../hooks/use-toast';
import apiClient from '../../utils/apiClient';
import EditSupplierModal from './EditSupplierModal';
import ViewSupplierModal from './ViewSupplierModal';
import EditContactModal from './EditContactModal';
import ScoreSupplierModal from './ScoreSupplierModal';
import BlacklistSupplierModal from './BlacklistSupplierModal';
import ContactEmailModal from './ContactEmailModal';
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
  MessageSquare,
  UserCheck
} from 'lucide-react';

// ActionMenuPopover Component for Suppliers
const SupplierActionMenuPopover = ({ supplier, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Sil', icon: Trash2, color: 'text-red-600 hover:text-red-800', action: 'delete' },
    { label: 'Pasif', icon: UserX, color: 'text-yellow-600 hover:text-yellow-800', action: 'passive' },
    { label: 'Puan', icon: Star, color: 'text-gray-600 hover:text-gray-800', action: 'rating' },
    { label: 'Kara Liste', icon: Ban, color: 'text-red-700 hover:text-red-900', action: 'blacklist' },
  ];

  const handleMenuAction = (action) => {
    onAction(action, supplier);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Daha Fazla İşlem</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] min-w-[140px]"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full text-left px-3 py-2 text-sm ${item.color} hover:bg-gray-50 flex items-center space-x-2 ${
                index === 0 ? 'rounded-t-lg' : ''
              } ${index === menuItems.length - 1 ? 'rounded-b-lg' : ''}`}
              onClick={() => handleMenuAction(item.action)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AllSuppliersPage = ({ onBackToDashboard, onNewSupplier }) => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierContacts, setSupplierContacts] = useState({});
  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showEditContactModal, setShowEditContactModal] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(null);
  const [showBlacklistModal, setShowBlacklistModal] = useState(null);
  const [showContactEmailModal, setShowContactEmailModal] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { tenantSlug } = useParams();

  useEffect(() => {
    if (tenantSlug) {
      apiClient.setTenantSlug(tenantSlug);
    }
    loadData();
  }, [tenantSlug]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Use tenant-aware API for suppliers
      const suppliersResponse = await apiClient.getSuppliers();
      const categoriesRes = await fetch(`${backendUrl}/api/supplier-categories`);

      if (suppliersResponse && suppliersResponse.status === 'success' && categoriesRes.ok) {
        const suppliersData = suppliersResponse.data || [];
        const categoriesData = await categoriesRes.json();

        console.log(`✅ Loaded ${suppliersData.length} suppliers from tenant-aware API`);
        console.log(`📊 Tenant: ${suppliersResponse.tenant?.name}`);

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
    }
  };

  const handleContactMail = (contact, supplier) => {
    setShowContactEmailModal({ contact, supplier });
  };

  const handleEmailSent = async () => {
    setShowContactEmailModal(null);
    toast({
      title: "Başarılı",
      description: "E-posta başarıyla gönderildi",
      variant: "default"
    });
  };

  const handleContactRegistration = (contact) => {
    if (!contact.unique_url_key) {
      toast({
        title: "Hata",
        description: "Bu kişi için kayıt linki oluşturulmamış",
        variant: "destructive"
      });
      return;
    }
    
    // Create registration URL
    const registrationUrl = `${window.location.origin}/contact-registration/${contact.unique_url_key}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(registrationUrl).then(() => {
      toast({
        title: "Başarılı",
        description: "Kayıt linki kopyalandı",
        variant: "default"
      });
    }).catch(() => {
      // Fallback - show URL in alert if clipboard doesn't work
      alert(`Kayıt linki: ${registrationUrl}`);
    });
  };

  const handleContactMessage = (contact, supplier) => {
    toast({
      title: "Özellik",
      description: "Mesajlaşma özelliği yakında aktif olacak",
      variant: "default"
    });
  };

  const handleEditContact = (contact, supplier) => {
    setShowEditContactModal({ contact, supplier });
  };

  const handleContactSave = async () => {
    // Reload contacts for the current supplier
    if (showEditContactModal?.supplier?.id) {
      await loadSupplierContacts(showEditContactModal.supplier.id);
    }
    setShowEditContactModal(null);
  };

  const handleSupplierAction = (action, supplier) => {
    switch (action) {
      case 'delete':
        setShowDeleteModal(supplier);
        break;
      case 'passive':
        handleSetPassive(supplier.id);
        break;
      case 'blacklist':
        handleSetBlacklist(supplier);
        break;
      case 'rating':
        handleSetScore(supplier);
        break;
      default:
        break;
    }
  };

  const handleSetBlacklist = (supplier) => {
    setShowBlacklistModal(supplier);
  };

  const handleSetScore = (supplier) => {
    setShowScoreModal(supplier);
  };

  const handleScoreSaved = async () => {
    await loadData();
    setShowScoreModal(null);
  };

  const handleBlacklistSaved = async () => {
    await loadData();
    setShowBlacklistModal(null);
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

  // Filter suppliers based on search criteria
  const filteredSuppliers = suppliers.filter(supplier => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = supplier.company_short_name?.toLowerCase().includes(searchLower) ||
                         supplier.company_title?.toLowerCase().includes(searchLower);
      const matchesPhone = supplier.phone?.includes(searchTerm);
      const matchesEmail = supplier.email?.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesPhone && !matchesEmail) {
        return false;
      }
    }

    // Status filter
    if (statusFilter && supplier.status !== statusFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter && supplier.supplier_type_id !== parseInt(categoryFilter)) {
      return false;
    }

    // Date range filter (assuming created_at field exists)
    if (startDate && supplier.created_at) {
      const supplierDate = new Date(supplier.created_at);
      const filterStartDate = new Date(startDate);
      if (supplierDate < filterStartDate) {
        return false;
      }
    }

    if (endDate && supplier.created_at) {
      const supplierDate = new Date(supplier.created_at);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999); // End of day
      if (supplierDate > filterEndDate) {
        return false;
      }
    }

    return true;
  });

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToDashboard}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Geri dön"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-blue-600" />
              Tüm Tedarikçiler
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Sistemdeki tüm tedarikçiler ve detayları
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={onBackToDashboard}
            variant="outline"
            className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
          >
            Dashboard
          </Button>
          <Button 
            onClick={onNewSupplier}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Tedarikçi
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Aktif Tedarikçiler</p>
                <p className="text-2xl font-bold text-green-900">
                  {suppliers.filter(s => s.status === 'active').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Toplam Tedarikçi</p>
                <p className="text-2xl font-bold text-orange-900">
                  {suppliers.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Pasif Tedarikçiler</p>
                <p className="text-2xl font-bold text-purple-900">
                  {suppliers.filter(s => s.status === 'passive').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <UserX className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Kategori Sayısı</p>
                <p className="text-2xl font-bold text-blue-900">
                  {new Set(suppliers.map(s => s.supplier_type_id)).size}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Tag className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Module */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Tedarikçi adı, telefon ara..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
                <option value="blacklist">Kara Liste</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Arama kriterlerinize uygun tedarikçi bulunamadı.</p>
              <p className="text-sm text-gray-400 mt-2">Filtreleri temizleyerek tekrar deneyin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded-lg overflow-hidden">
                  {/* Main Supplier Row */}
                  <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Expansion Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleExpandSupplier(supplier.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={expandedSupplier === supplier.id ? "Tedarikçiyi daralt" : "Tedarikçiyi genişlet"}
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
                        <SupplierActionMenuPopover supplier={supplier} onAction={handleSupplierAction} />
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
                                    <Button size="sm" variant="outline" onClick={() => handleEditContact(contact, supplier)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleContactMessage(contact, supplier)}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleContactMail(contact, supplier)}
                                      disabled={!contact.email}
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleContactRegistration(contact)}
                                      disabled={!contact.unique_url_key}
                                      className="text-purple-600 hover:text-purple-800"
                                    >
                                      <UserCheck className="h-4 w-4" />
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

      {/* Edit Contact Modal */}
      {showEditContactModal && (
        <EditContactModal 
          contact={showEditContactModal.contact}
          supplier={showEditContactModal.supplier}
          onClose={() => setShowEditContactModal(null)}
          onSave={handleContactSave}
        />
      )}

      {/* Score Supplier Modal */}
      {showScoreModal && (
        <ScoreSupplierModal 
          supplier={showScoreModal}
          onClose={() => setShowScoreModal(null)}
          onSave={handleScoreSaved}
        />
      )}

      {/* Blacklist Supplier Modal */}
      {showBlacklistModal && (
        <BlacklistSupplierModal 
          supplier={showBlacklistModal}
          onClose={() => setShowBlacklistModal(null)}
          onSave={handleBlacklistSaved}
        />
      )}

      {/* Contact Email Modal */}
      {showContactEmailModal && (
        <ContactEmailModal 
          contact={showContactEmailModal.contact}
          supplier={showContactEmailModal.supplier}
          onClose={() => setShowContactEmailModal(null)}
          onSent={handleEmailSent}
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