import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '../../hooks/use-toast';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  FileText,
  X,
  Building,
  Users,
  TrendingUp,
  MessageSquare,
  Mail,
  FileUser,
  Receipt,
  UserX,
  Star,
  Trash2
} from 'lucide-react';
import { customerTagColors } from '../../mock/customersData';
import ViewPersonModal from './ViewPersonModal';
import EditPersonModal from './EditPersonModal';
import CustomerEmailModal from './CustomerEmailModal';

// ActionMenuPopover Component
const ActionMenuPopover = ({ customer, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Mesaj', icon: MessageSquare, color: 'text-blue-600 hover:text-blue-800', action: 'message' },
    { label: 'Mail', icon: Mail, color: 'text-green-600 hover:text-green-800', action: 'email' },
    { label: 'Teklif', icon: FileUser, color: 'text-purple-600 hover:text-purple-800', action: 'quote' },
    { label: 'Fatura', icon: Receipt, color: 'text-orange-600 hover:text-orange-800', action: 'invoice' },
    { label: 'Pasif', icon: UserX, color: 'text-red-600 hover:text-red-800', action: 'inactive' },
    { label: 'Favori', icon: Star, color: 'text-yellow-600 hover:text-yellow-800', action: 'favorite' },
    { label: 'Sil', icon: Trash2, color: 'text-red-700 hover:text-red-900', action: 'delete' },
  ];

  const handleMenuAction = (action) => {
    onAction(action, customer);
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
          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]"
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

export default function AllCustomersPage({ onBackToDashboard, customers = [] }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [sortBy, setSortBy] = useState('companyName');

  // Modal states - placeholder for future implementation
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const getSectorCounts = () => {
    const counts = {};
    filteredCustomers.forEach(customer => {
      const sector = customer.sector || 'Diğer';
      counts[sector] = (counts[sector] || 0) + 1;
    });
    return counts;
  };

  const getCountryCounts = () => {
    const counts = {};
    filteredCustomers.forEach(customer => {
      const country = customer.country || 'Bilinmiyor';
      counts[country] = (counts[country] || 0) + 1;
    });
    return counts;
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.sector && customer.sector.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Tag search filter
    if (tagSearch) {
      filtered = filtered.filter(customer =>
        customer.tags && customer.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Sector filter
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(customer => customer.sector === sectorFilter);
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(customer => customer.country === countryFilter);
    }

    // Relationship filter
    if (relationshipFilter !== 'all') {
      filtered = filtered.filter(customer => customer.relationshipType === relationshipFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'companyName':
          return a.companyName.localeCompare(b.companyName);
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'customerSince':
          return new Date(b.customerSince) - new Date(a.customerSince);
        case 'lastActivity':
          return new Date(b.lastActivity) - new Date(a.lastActivity);
        default:
          return a.companyName.localeCompare(b.companyName);
      }
    });

    return filtered;
  }, [searchTerm, tagSearch, statusFilter, sectorFilter, countryFilter, relationshipFilter, sortBy]);

  const sectorCounts = getSectorCounts();
  const countryCounts = getCountryCounts();

  const clearFilters = () => {
    setSearchTerm('');
    setTagSearch('');
    setStatusFilter('all');
    setSectorFilter('all');
    setCountryFilter('all');
    setRelationshipFilter('all');
    setSortBy('companyName');
  };

  const formatCurrency = (amount, currency) => {
    if (amount === 0) return '-';
    
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'TRY': '₺'
    };
    
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
    toast({
      title: "Müşteri Detayları",
      description: `${customer.companyName} detayları görüntüleniyor`,
    });
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setEditModalOpen(true);
    toast({
      title: "Müşteri Düzenleme",
      description: `${customer.companyName} bilgileri düzenleniyor`,
    });
  };

  // Delete customer function
  const handleDeleteCustomer = async (customer) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `"${customer.companyName}" müşterisini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`
    );
    
    if (!confirmDelete) return;

    try {
      // Check if customer has related records before deletion
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // First check if customer can be deleted (no related records)
      const checkResponse = await fetch(`${backendUrl}/api/customers/${customer.id}/can-delete`);
      const canDeleteData = await checkResponse.json();
      
      if (!canDeleteData.canDelete) {
        // Customer has related records, show error
        toast({
          title: "Müşteri Silinemez",
          description: `${customer.companyName} müşterisinin ilişkili kayıtları bulunduğu için silinemez.\n\nİlişkili kayıtlar: ${canDeleteData.relatedRecords.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
      
      // Customer can be deleted
      const deleteResponse = await fetch(`${backendUrl}/api/customers/${customer.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        toast({
          title: "Müşteri Silindi",
          description: `${customer.companyName} başarıyla silindi.`
        });
        
        // Refresh the page or update the customer list
        window.location.reload();
      } else {
        throw new Error('Silme işlemi başarısız');
      }
      
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  };

  const handleAction = (action, customer) => {
    if (action === 'delete') {
      handleDeleteCustomer(customer);
      return;
    }

    if (action === 'email') {
      setSelectedCustomer(customer);
      setEmailModalOpen(true);
      return;
    }

    const actionMessages = {
      message: {
        title: "Mesaj Gönder",
        description: `${customer.companyName} için mesaj gönderme sayfası açılıyor...`
      },
      quote: {
        title: "Teklif Oluştur",
        description: `${customer.companyName} için yeni teklif oluşturma sayfası açılıyor...`
      },
      invoice: {
        title: "Fatura Oluştur",
        description: `${customer.companyName} için yeni fatura oluşturma sayfası açılıyor...`
      },
      inactive: {
        title: "Müşteriyi Pasif Yap",
        description: `${customer.companyName} pasif müşteriler listesine taşınıyor...`
      },
      favorite: {
        title: "Favori Müşteri Yap",
        description: `${customer.companyName} favori müşteriler listesine ekleniyor...`
      }
    };

    const message = actionMessages[action] || {
      title: `${action} işlemi`,
      description: `${customer.companyName} için ${action} işlemi başlatıldı.`
    };

    toast({
      title: message.title,
      description: message.description,
    });
  };

  const exportToExcel = () => {
    toast({
      title: "Excel Aktarımı",
      description: `${filteredCustomers.length} müşteri Excel dosyasına aktarılıyor...`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600" />
              <span>Tüm Müşteriler</span>
            </h1>
            <p className="text-gray-600 mt-1">Sistemdeki tüm müşterilerin kapsamlı görünümü</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 px-6"
            >
              <FileText className="h-4 w-4 mr-2" />
              Excel Aktarım
            </Button>
            <Button
              variant="outline"
              onClick={onBackToDashboard}
              className="px-6"
            >
              <X className="h-4 w-4 mr-2" />
              Kapat
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aktif Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.filter(c => c.status === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.length > 0 ? (customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0) / 1000000).toFixed(1) : '0'}M ₺
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ort. Müşteri Değeri</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0) / customers.length / 1000) : 0}K ₺
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Müşteri ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tag Search */}
              <Input
                placeholder="Tag ara (örn: TEKNOLOJI)..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />

              {/* Sector Filter */}
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sektör" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sektörler</SelectItem>
                  {Object.keys(sectorCounts).map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector} ({sectorCounts[sector]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Country Filter */}
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ülke" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Ülkeler</SelectItem>
                  {Object.keys(countryCounts).map((country) => (
                    <SelectItem key={country} value={country}>
                      {country} ({countryCounts[country]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Relationship Filter */}
              <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="İlişki türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İlişkiler</SelectItem>
                  <SelectItem value="customer">Müşteri</SelectItem>
                  <SelectItem value="potential_customer">Potansiyel Müşteri</SelectItem>
                  <SelectItem value="supplier">Tedarikçi</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sıralama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="companyName">Şirket Adı</SelectItem>
                  <SelectItem value="revenue">Toplam Ciro</SelectItem>
                  <SelectItem value="customerSince">Müşteri Olma Tarihi</SelectItem>
                  <SelectItem value="lastActivity">Son Aktivite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>{filteredCustomers.length} müşteri bulundu</span>
              </div>
              {(searchTerm || tagSearch || sectorFilter !== 'all' || countryFilter !== 'all' || relationshipFilter !== 'all' || sortBy !== 'companyName') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="h-4 w-4 mr-1" />
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <div className="px-6 pb-6">
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">No.</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Şirket</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Ciro</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Proje</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Etiketler</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-700 text-xs">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr 
                      key={customer.id}
                      className={`border-b border-gray-100 hover:bg-blue-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:shadow-md`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                            {String(index + 1).padStart(3, '0')}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-150 text-sm max-w-[160px] truncate flex items-center space-x-2">
                                  <Building className="h-3 w-3 text-gray-400" />
                                  <span>{customer.companyName}</span>
                                </div>
                                <div className="text-xs text-gray-500 max-w-[160px] truncate flex items-center space-x-1">
                                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                  <span>{customer.country}</span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {customer.companyName}<br/>
                                İletişim: {customer.contactPerson}<br/>
                                Email: {customer.email}<br/>
                                Müşteri: {formatDate(customer.customerSince)}<br/>
                                Son aktivite: {formatDate(customer.lastActivity)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-green-600 text-sm">
                            {formatCurrency(customer.totalRevenue, customer.currency)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.totalOrders} sipariş
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="text-center">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {customer.totalProjects || Math.floor(Math.random() * 15) + 1}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            proje
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {customer.tags && customer.tags.map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              className={`text-[9px] px-1 py-0.5 ${customerTagColors[tag] || 'bg-gray-500 text-white'} border-0`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  onClick={() => handleView(customer)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Detayları Görüntüle</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                  onClick={() => handleEdit(customer)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Düzenle</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <ActionMenuPopover customer={customer} onAction={handleAction} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <Building className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Müşteri bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Arama kriterlerinize uygun müşteri bulunmamaktadır.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Customer Modal */}
      {viewModalOpen && selectedCustomer && (
        <ViewPersonModal
          person={selectedCustomer}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {editModalOpen && selectedCustomer && (
        <EditPersonModal
          person={selectedCustomer}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedCustomer(null);
          }}
          onSave={(updatedCustomer) => {
            // Handle customer update here
            toast({
              title: "Müşteri Güncellendi",
              description: `${updatedCustomer.companyName || updatedCustomer.name} başarıyla güncellendi.`,
            });
            setEditModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Email Customer Modal */}
      {emailModalOpen && selectedCustomer && (
        <CustomerEmailModal
          customer={selectedCustomer}
          onClose={() => {
            setEmailModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}