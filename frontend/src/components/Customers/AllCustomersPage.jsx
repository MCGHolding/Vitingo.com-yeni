import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Trash2,
  UserPlus,
  Phone,
  MapPin,
  MessageCircle,
  Activity
} from 'lucide-react';
// import { customerTagColors } from '../../mock/customersData'; // Removed - using inline colors
import DeleteCustomerModal from './DeleteCustomerModal';

const customerTagColors = {
  'premium': 'bg-purple-500 text-white',
  'vip': 'bg-gold-500 text-white bg-yellow-500',
  'regular': 'bg-blue-500 text-white',
  'new': 'bg-green-500 text-white',
  'inactive': 'bg-gray-500 text-white',
  'high-value': 'bg-red-500 text-white',
  'potential': 'bg-orange-500 text-white'
};
import ViewCustomerModal from './ViewCustomerModal';
import EditCustomerModal from './EditCustomerModal';
import ViewPersonModal from './ViewPersonModal';
import EditPersonModal from './EditPersonModal';
import CustomerEmailModal from './CustomerEmailModal';

// ActionMenuPopover Component - FIXED: Dropdown now appears as overlay
const ActionMenuPopover = ({ customer, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const menuItems = [
    { label: 'Mesaj', icon: MessageSquare, color: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50', action: 'message' },
    { label: 'Mail', icon: Mail, color: 'text-green-600 hover:text-green-800 hover:bg-green-50', action: 'email' },
    { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50', action: 'whatsapp' },
    { label: 'Teklif', icon: FileUser, color: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50', action: 'quote' },
    { label: 'Fatura', icon: Receipt, color: 'text-orange-600 hover:text-orange-800 hover:bg-orange-50', action: 'invoice' },
    { label: 'Pasif', icon: UserX, color: 'text-red-600 hover:text-red-800 hover:bg-red-50', action: 'inactive' },
    { label: 'Favori', icon: Star, color: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50', action: 'favorite' },
    { label: 'Sil', icon: Trash2, color: 'text-red-700 hover:text-red-900 hover:bg-red-50', action: 'delete' },
  ];

  const handleMenuAction = (action) => {
    onAction(action, customer);
    setIsOpen(false);
  };

  const togglePopover = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Menü yüksekliği (7 item * ~40px per item = ~280px)
      const menuHeight = menuItems.length * 40 + 20; // Adding padding
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Eğer altta yeterli yer varsa alta aç, yoksa üste aç
      const shouldOpenUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      
      console.log('Menu position calc:', {
        spaceBelow,
        spaceAbove,
        menuHeight,
        shouldOpenUpward,
        rectBottom: rect.bottom,
        rectTop: rect.top
      });
      
      setPosition({
        top: shouldOpenUpward ? rect.top - menuHeight - 4 : rect.bottom + 4,
        right: window.innerWidth - rect.right,
        openUpward: shouldOpenUpward
      });
    }
    
    console.log('Toggle popover - isOpen will be:', !isOpen);
    setIsOpen(!isOpen);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={buttonRef}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              onClick={togglePopover}
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
          ref={popoverRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] max-h-[300px] overflow-y-auto animate-in fade-in-0 zoom-in-95"
          style={{ 
            top: `${position.top}px`, 
            right: `${position.right}px`,
            zIndex: 9999
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full text-left px-3 py-2 text-sm ${item.color} flex items-center space-x-2 transition-colors duration-150 ${
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
    </>
  );
};

export default function AllCustomersPage({ onBackToDashboard, customers = [], refreshCustomers, onViewCustomer, onEditCustomer, onNewCustomer }) {
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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
    // Filter out prospects and passive customers - only show active regular customers
    let filtered = customers.filter(customer => 
      !customer.isProspect && 
      customer.status !== 'passive'
    );

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
    if (onViewCustomer) {
      onViewCustomer(customer);
    } else {
      // Fallback to modal for backwards compatibility
      setSelectedCustomer(customer);
      setViewModalOpen(true);
      toast({
        title: "Müşteri Detayları",
        description: `${customer.companyName || customer.name} detayları görüntüleniyor`,
      });
    }
  };

  const handleEdit = (customer) => {
    if (onEditCustomer) {
      onEditCustomer(customer);
    } else {
      // Fallback to modal for backwards compatibility
      setSelectedCustomer(customer);
      setEditModalOpen(true);
      toast({
        title: "Müşteri Düzenleme",
        description: `${customer.companyName || customer.name} bilgileri düzenleniyor`,
      });
    }
  };

  const handleEditCustomer = (customer) => {
    setViewModalOpen(false);
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  };

  const handleSaveCustomer = async (updatedCustomer) => {
    try {
      // Handle customer update here
      toast({
        title: "Müşteri Güncellendi",
        description: `${updatedCustomer.companyName || updatedCustomer.name} başarıyla güncellendi.`,
      });
      
      // Refresh customers list
      if (refreshCustomers) {
        await refreshCustomers();
      }
      
      setEditModalOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Müşteri güncellenirken bir hata oluştu.",
      });
    }
  };

  // Open delete modal
  const handleDeleteCustomer = (customer) => {
    setSelectedCustomer(customer);
    setDeleteModalOpen(true);
  };

  const handleToggleFavorite = async (customer) => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/customers/${customer.id}/toggle-favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite status');
      }

      const data = await response.json();
      
      toast({
        title: data.isFavorite ? "Favorilere Eklendi" : "Favorilerden Çıkarıldı",
        description: data.message,
      });

      // Refresh the customers list
      if (typeof refreshCustomers === 'function') {
        console.log('✅ Calling refreshCustomers after favorite toggle');
        await refreshCustomers();
      } else {
        console.error('❌ refreshCustomers function not available');
        toast({
          title: "Hata", 
          description: "Liste yenileme fonksiyonu bulunamadı.",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Hata",
        description: "Favori durumu güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (customer) => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/customers/${customer.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle customer status');
      }

      const data = await response.json();
      
      toast({
        title: data.status === 'passive' ? "Müşteri Pasife Alındı" : "Müşteri Aktif Hale Getirildi",
        description: data.message,
      });

      // Refresh the customers list to remove passive customer from active list
      if (typeof refreshCustomers === 'function') {
        console.log('✅ Calling refreshCustomers after status toggle');
        await refreshCustomers();
      } else {
        console.error('❌ refreshCustomers function not available');
        toast({
          title: "Hata", 
          description: "Liste yenileme fonksiyonu bulunamadı.",
        });
      }
    } catch (error) {
      console.error('Error toggling customer status:', error);
      toast({
        title: "Hata",
        description: "Müşteri durumu güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Handle successful deletion/deactivation
  const handleDeleteSuccess = async () => {
    console.log('🎉 handleDeleteSuccess called - refreshing customers...');
    
    // Refresh customers list without page reload
    if (refreshCustomers) {
      console.log('🔄 Calling refreshCustomers function...');
      try {
        await refreshCustomers();
        console.log('✅ refreshCustomers completed successfully');
        
        // Small delay to ensure state update
        setTimeout(() => {
          toast({
            title: "İşlem Tamamlandı",
            description: "Müşteri işlemi başarıyla tamamlandı.",
          });
        }, 500);
        
      } catch (error) {
        console.error('❌ refreshCustomers failed:', error);
        toast({
          title: "Hata",
          description: "Liste yenilenemedi. Sayfayı yenileyin.",
        });
      }
    } else {
      console.error('❌ refreshCustomers function not available');
      toast({
        title: "Hata", 
        description: "Liste yenileme fonksiyonu bulunamadı.",
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

    if (action === 'whatsapp') {
      // WhatsApp'tan iletişim kur
      const phoneNumber = customer.phone || customer.mobile;
      if (phoneNumber) {
        // Telefon numarasını temizle (sadece rakamlar)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        // WhatsApp Web link'i aç
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
        toast({
          title: "WhatsApp Açılıyor",
          description: `${customer.companyName || customer.contactPerson} ile WhatsApp üzerinden iletişime geçiliyor...`
        });
      } else {
        toast({
          title: "Telefon Numarası Bulunamadı",
          description: `${customer.companyName || 'Bu müşteri'} için telefon numarası kayıtlı değil.`,
          variant: "destructive"
        });
      }
      return;
    }

    if (action === 'favorite') {
      handleToggleFavorite(customer);
      return;
    }

    if (action === 'inactive') {
      handleToggleStatus(customer);
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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600" />
              <span>Müşteriler</span>
            </h1>
            <p className="text-gray-600 mt-1">Sistemdeki tüm müşterilerin kapsamlı görünümü</p>
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
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Müşteri Tipi</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Şirket Adı/Ünvanı</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">İletişim</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Ülke/Şehir</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Yetkili Kişi</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr 
                      key={customer.id}
                      className={`border-b border-gray-100 hover:bg-blue-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {/* NO */}
                      <td className="py-4 px-4">
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-bold text-center min-w-[40px]">
                          {String(index + 1).padStart(3, '0')}
                        </div>
                      </td>
                      
                      {/* MÜŞTERİ TİPİ */}
                      <td className="py-4 px-4">
                        {customer.relationshipType ? (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {customer.relationshipType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      
                      {/* ŞİRKET ADI/ÜNVANI */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span>{customer.companyName || customer.company_short_name || 'Şirket Adı Yok'}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.companyTitle || 'Ünvan bilgisi yok'}
                          </div>
                        </div>
                      </td>
                      
                      {/* İLETİŞİM */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center space-x-2 text-xs text-gray-700">
                              <Phone className="h-3 w-3 text-green-600" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <Mail className="h-3 w-3 text-blue-600" />
                              <span className="truncate max-w-[150px]">{customer.email}</span>
                            </div>
                          )}
                          {!customer.phone && !customer.email && (
                            <span className="text-xs text-gray-400">İletişim bilgisi yok</span>
                          )}
                        </div>
                      </td>
                      
                      {/* ÜLKE/ŞEHİR */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {customer.city && (
                            <div className="flex items-center space-x-2 text-xs text-gray-700">
                              <MapPin className="h-3 w-3 text-red-500" />
                              <span className="font-medium">{customer.city}</span>
                            </div>
                          )}
                          {customer.country && (
                            <div className="text-xs text-gray-500 flex items-center space-x-1 ml-5">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              <span>{customer.country}</span>
                            </div>
                          )}
                          {!customer.city && !customer.country && (
                            <span className="text-xs text-gray-400">Adres bilgisi yok</span>
                          )}
                        </div>
                      </td>
                      
                      {/* YETKİLİ KİŞİ */}
                      <td className="py-4 px-4">
                        {customer.contactPerson ? (
                          <div className="flex items-center space-x-2 text-xs text-gray-700">
                            <User className="h-3 w-3 text-indigo-600" />
                            <span className="font-medium">{customer.contactPerson}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
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
        <ViewCustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedCustomer(null);
          }}
          onEdit={handleEditCustomer}
        />
      )}

      {/* Edit Customer Modal */}
      {editModalOpen && selectedCustomer && (
        <EditCustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedCustomer(null);
          }}
          onSave={handleSaveCustomer}
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

      {/* Delete Customer Modal */}
      {deleteModalOpen && selectedCustomer && (
        <DeleteCustomerModal
          customer={selectedCustomer}
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedCustomer(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}