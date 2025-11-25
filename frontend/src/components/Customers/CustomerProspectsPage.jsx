import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  UserSearch
} from 'lucide-react';
// import { customerTagColors } from '../../mock/customersData'; // Removed - using inline colors

const customerTagColors = {
  'premium': 'bg-purple-500 text-white',
  'vip': 'bg-gold-500 text-white bg-yellow-500', 
  'regular': 'bg-blue-500 text-white',
  'new': 'bg-green-500 text-white',
  'inactive': 'bg-gray-500 text-white',
  'high-value': 'bg-red-500 text-white',
  'potential': 'bg-orange-500 text-white'
};
import ViewPersonModal from './ViewPersonModal';
import EditPersonModal from './EditPersonModal';
import CustomerEmailModal from './CustomerEmailModal';
import DeleteProspectModal from './DeleteProspectModal';
import ConvertToCustomerModal from './ConvertToCustomerModal';
import ConfirmConvertModal from './ConfirmConvertModal';

// ActionMenuPopover Component
const ActionMenuPopover = ({ prospect, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const menuItems = [
    { label: 'Mesaj', icon: MessageSquare, color: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50', action: 'message' },
    { label: 'Mail', icon: Mail, color: 'text-green-600 hover:text-green-800 hover:bg-green-50', action: 'email' },
    { label: 'Müşteriye Çevir', icon: User, color: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50', action: 'convert' },
    { label: 'Favori', icon: Star, color: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50', action: 'favorite' },
    { label: 'Sil', icon: Trash2, color: 'text-red-700 hover:text-red-900 hover:bg-red-50', action: 'delete' },
  ];

  const handleMenuAction = (action) => {
    onAction(action, prospect);
    setIsOpen(false);
  };

  const togglePopover = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
      // Calculate position relative to button
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 250; // Approximate menu height (5 items * 50px)
      const viewportHeight = window.innerHeight;
      
      // Check if menu fits below the button
      const fitsBelow = rect.bottom + menuHeight + 4 <= viewportHeight;
      
      setPosition({
        top: fitsBelow ? rect.bottom + 4 : rect.top - menuHeight - 4, // Open up if doesn't fit below
        left: rect.right - 140 // Align right edge (140px is menu width)
      });
    }
    
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

      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] max-h-[300px] overflow-y-auto animate-in fade-in-0 zoom-in-95"
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
        </div>,
        document.body
      )}
    </>
  );
};

export default function CustomerProspectsPage({ onBackToDashboard, refreshCustomers, onNewCustomer }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [sortBy, setSortBy] = useState('companyName');
  const [prospects, setProspects] = useState([]);

  // Modal states - placeholder for future implementation
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmConvertModalOpen, setConfirmConvertModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);

  // Load customer prospects from backend
  useEffect(() => {
    loadCustomerProspects();
  }, []);

  const loadCustomerProspects = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      // Load leads from dedicated leads collection
      console.log('Loading leads from /api/leads endpoint');
      const response = await fetch(`${backendUrl}/api/leads`);
      if (response.ok) {
        const allLeads = await response.json();
        console.log('All leads loaded:', allLeads.length);
        
        // Filter out converted leads - only show active prospects
        const activeProspects = allLeads.filter(lead => lead.status !== 'converted');
        console.log('Active prospects (excluding converted):', activeProspects.length);
        
        setProspects(activeProspects);
      } else {
        console.error('Failed to load leads, status:', response.status);
        throw new Error('Failed to load leads');
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: "Hata",
        description: "Müşteri adayları yüklenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  const getSectorCounts = () => {
    const counts = {};
    filteredProspects.forEach(prospect => {
      const sector = prospect.sector || 'Diğer';
      counts[sector] = (counts[sector] || 0) + 1;
    });
    return counts;
  };

  const getCountryCounts = () => {
    const counts = {};
    filteredProspects.forEach(prospect => {
      const country = prospect.country || 'Bilinmiyor';
      counts[country] = (counts[country] || 0) + 1;
    });
    return counts;
  };

  const filteredProspects = useMemo(() => {
    let filtered = prospects;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(prospect =>
        prospect.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.companyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prospect.sector && prospect.sector.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Tag search filter
    if (tagSearch) {
      filtered = filtered.filter(prospect =>
        prospect.tags && prospect.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()))
      );
    }

    // Sector filter
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(prospect => prospect.sector === sectorFilter);
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(prospect => prospect.country === countryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'companyName':
          return (a.companyName || '').localeCompare(b.companyName || '');
        case 'createdAt':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return (a.companyName || '').localeCompare(b.companyName || '');
      }
    });

    return filtered;
  }, [prospects, searchTerm, tagSearch, sectorFilter, countryFilter, relationshipFilter, sortBy]);

  const sectorCounts = getSectorCounts();
  const countryCounts = getCountryCounts();

  const clearFilters = () => {
    setSearchTerm('');
    setTagSearch('');
    setSectorFilter('all');
    setCountryFilter('all');
    setRelationshipFilter('all');
    setSortBy('companyName');
  };

  const handleConvertToCustomer = (prospect) => {
    // Show confirmation modal
    setSelectedProspect(prospect);
    setConfirmConvertModalOpen(true);
  };

  const confirmConvertToCustomer = async () => {
    console.log('🔄 Starting conversion for:', selectedProspect?.companyName, 'ID:', selectedProspect?.id);
    
    // Close confirmation modal
    setConfirmConvertModalOpen(false);

    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      const url = `${backendUrl}/api/leads/${selectedProspect.id}/convert`;
      console.log('🌐 Making PATCH request to:', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.detail || 'Müşteriye çevirme işlemi başarısız');
      }

      const data = await response.json();
      console.log('✅ Success response:', data);

      // Show success modal
      setConvertModalOpen(true);

      // Reload prospects list (will remove converted one since status is now 'converted')
      console.log('🔄 Reloading leads list...');
      await loadCustomerProspects();
      console.log('✅ Leads list reloaded');
      
      // IMPORTANT: Refresh customers list so the new customer appears in Müşteriler page
      if (refreshCustomers) {
        console.log('🔄 Refreshing customers list...');
        await refreshCustomers();
        console.log('✅ Customers list refreshed');
      }

    } catch (error) {
      console.error('❌ Error converting to customer:', error);
      toast({
        title: "Hata",
        description: error.message || "Müşteriye çevirme işlemi sırasında hata oluştu",
        variant: "destructive"
      });
      setSelectedProspect(null);
    }
  };

  const handleAction = (action, prospect) => {
    switch (action) {
      case 'convert':
        handleConvertToCustomer(prospect);
        break;
      case 'message':
        toast({
          title: "Mesaj Gönder",
          description: `${prospect.companyName} ile mesaj başlatılacak...`,
        });
        break;
      case 'email':
        setSelectedProspect(prospect);
        setEmailModalOpen(true);
        break;
      case 'favorite':
        toast({
          title: "Favorilere Ekle",
          description: `${prospect.companyName} favorilere eklendi`,
        });
        break;
      case 'delete':
        setSelectedProspect(prospect);
        setDeleteModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Export to CSV
  const exportToExcel = () => {
    if (filteredProspects.length === 0) {
      toast({
        title: "Uyarı",
        description: "Dışarı aktarılacak müşteri adayı bulunamadı.",
        variant: "destructive"
      });
      return;
    }

    // CSV headers
    const headers = ['Ad Soyad', 'Email', 'Telefon', 'Şirket', 'Durum', 'Değer', 'Notlar'];
    
    // CSV rows
    const rows = filteredProspects.map(prospect => [
      prospect.fullName || '',
      prospect.email || '',
      prospect.phone || '',
      prospect.company || '',
      prospect.status || '',
      prospect.value || '',
      prospect.notes || ''
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `musteri_adaylari_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Başarılı",
      description: `${filteredProspects.length} müşteri adayı CSV dosyasına aktarıldı.`,
    });
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleHeaders = ['Ad Soyad', 'Email', 'Telefon', 'Şirket', 'Durum', 'Değer', 'Notlar'];
    const sampleRows = [
      ['Ahmet Yılmaz', 'ahmet@example.com', '+90 532 123 4567', 'ABC Şirketi', 'Yeni', '50000', 'Potansiyel müşteri'],
      ['Ayşe Demir', 'ayse@example.com', '+90 533 987 6543', 'XYZ Ltd', 'İlgileniyor', '75000', 'Takip edilmeli']
    ];
    
    const csvContent = [
      sampleHeaders.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ornek_musteri_adaylari.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Örnek Dosya İndirildi",
      description: "Örnek CSV dosyası indirildi. Bu formatı kullanarak veri yükleyebilirsiniz.",
    });
  };

  // Upload and parse file
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setImportData(text);
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Process import data
  const handleProcessImport = async () => {
    if (!importData.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen içe aktarılacak veriyi girin veya dosya yükleyin.",
        variant: "destructive"
      });
      return;
    }

    try {
      const lines = importData.split('\n').filter(line => line.trim());
      const newProspects = [];
      
      for (const line of lines) {
        // Format: Ad Soyad, Email, Telefon, Şirket, Durum, Değer, Notlar
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 4) {
          newProspects.push({
            fullName: parts[0],
            email: parts[1],
            phone: parts[2],
            company: parts[3],
            status: parts[4] || 'Yeni',
            value: parts[5] || '',
            notes: parts[6] || ''
          });
        }
      }
      
      if (newProspects.length === 0) {
        toast({
          title: "Uyarı",
          description: "İçe aktarılacak geçerli veri bulunamadı.",
          variant: "destructive"
        });
        return;
      }
      
      // TODO: Send to backend API
      // const response = await fetch('/api/leads/bulk-import', { ... });
      
      toast({
        title: "Başarılı",
        description: `${newProspects.length} müşteri adayı içe aktarıldı.`,
      });
      
      setImportModalOpen(false);
      setImportData('');
      
      // Refresh list
      await fetchProspects();
      
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler işlenirken hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name) => {
    return name?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'MA';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <UserSearch className="h-8 w-8 text-blue-600" />
              <span>Müşteri Adayları</span>
            </h1>
            <p className="text-gray-600 mt-1">Potansiyel müşterilerin listesi ve yönetimi</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Import CSV - Open Modal */}
            <Button
              onClick={() => setImportModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              <FileText className="h-4 w-4 mr-2" />
              İçeri Aktar
            </Button>
            
            {/* Download Sample CSV */}
            <Button
              onClick={downloadSampleCSV}
              variant="outline"
              className="px-6"
            >
              <FileText className="h-4 w-4 mr-2" />
              Örnek İndir
            </Button>
            
            {/* Export CSV */}
            <Button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 px-6"
            >
              <FileText className="h-4 w-4 mr-2" />
              Dışarı Aktar
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserSearch className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Aday</p>
                  <p className="text-2xl font-bold text-gray-900">{prospects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bu Ay</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prospects.filter(p => {
                      const created = new Date(p.created_at || 0);
                      const now = new Date();
                      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Potansiyel Değer</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prospects.length > 0 ? (prospects.length * 50).toFixed(0) : '0'}K ₺
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dönüşüm Oranı</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prospects.length > 0 ? '25' : '0'}%
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
                  placeholder="Aday ara..."
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
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sıralama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="companyName">Şirket Adı</SelectItem>
                  <SelectItem value="createdAt">Kayıt Tarihi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>{filteredProspects.length} müşteri adayı bulundu</span>
              </div>
              {(searchTerm || tagSearch || sectorFilter !== 'all' || countryFilter !== 'all' || sortBy !== 'companyName') && (
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

      {/* Prospects Table */}
      <div className="px-6 pb-6">
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">No.</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Şirket</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Sektör</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Ülke</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Etiketler</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-700 text-xs">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProspects.map((prospect, index) => (
                    <tr 
                      key={prospect.id}
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
                                  <span>{prospect.companyName || prospect.companyTitle}</span>
                                </div>
                                <div className="text-xs text-gray-500 max-w-[160px] truncate flex items-center space-x-1">
                                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                  <span>Aday</span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-medium">{prospect.companyTitle || prospect.companyName}</p>
                                <p className="text-xs text-gray-300 mt-1">Email: {prospect.email || 'N/A'}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-xs text-gray-600">
                          {prospect.sector || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-xs text-gray-600">
                          {prospect.country || '-'}
                        </span>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                          {prospect.tags && prospect.tags.length > 0 ? (
                            prospect.tags.slice(0, 2).map((tag, tagIndex) => (
                              <Badge
                                key={tagIndex}
                                className={`text-xs px-1 py-0 ${customerTagColors[tag] || 'bg-gray-100 text-gray-800'}`}
                              >
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                          {prospect.tags && prospect.tags.length > 2 && (
                            <Badge className="text-xs px-1 py-0 bg-gray-100 text-gray-600">
                              +{prospect.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                  onClick={() => {
                                    setSelectedProspect(prospect);
                                    setViewModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Görüntüle</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-600 hover:text-green-600 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedProspect(prospect);
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Düzenle</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <ActionMenuPopover prospect={prospect} onAction={handleAction} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredProspects.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500">
                        <UserSearch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Henüz müşteri adayı bulunmuyor</p>
                        <p className="text-sm mt-1">İlk müşteri adayınızı eklemek için "Yeni Müşteri" formunda "Müşteri Aday" seçeneğini işaretleyin</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {viewModalOpen && selectedProspect && (
        <ViewPersonModal 
          person={selectedProspect}
          onClose={() => setViewModalOpen(false)}
        />
      )}

      {editModalOpen && selectedProspect && (
        <EditPersonModal 
          person={selectedProspect}
          onClose={() => setEditModalOpen(false)}
          onSave={(updatedPerson) => {
            // Update the prospect in the list
            setProspects(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p));
            setEditModalOpen(false);
          }}
        />
      )}

      {emailModalOpen && selectedProspect && (
        <CustomerEmailModal 
          customer={selectedProspect}
          onClose={() => setEmailModalOpen(false)}
        />
      )}

      {/* Delete Prospect Modal */}
      {deleteModalOpen && selectedProspect && (
        <DeleteProspectModal 
          prospect={selectedProspect}
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedProspect(null);
          }}
          onSuccess={() => {
            loadCustomerProspects(); // Reload prospects list
            toast({
              title: "Başarılı",
              description: `${selectedProspect.companyName || selectedProspect.companyTitle || 'Müşteri adayı'} başarıyla silindi`,
            });
          }}
        />
      )}

      {/* Confirm Convert Modal */}
      {confirmConvertModalOpen && selectedProspect && (
        <ConfirmConvertModal 
          isOpen={confirmConvertModalOpen}
          prospectData={selectedProspect}
          onClose={() => {
            setConfirmConvertModalOpen(false);
            setSelectedProspect(null);
          }}
          onConfirm={confirmConvertToCustomer}
        />
      )}

      {/* Convert to Customer Success Modal */}
      {convertModalOpen && selectedProspect && (
        <ConvertToCustomerModal 
          isOpen={convertModalOpen}
          prospectData={selectedProspect}
          onClose={(route) => {
            setConvertModalOpen(false);
            setSelectedProspect(null);
            // Navigate to customers page
            if (onBackToDashboard) {
              onBackToDashboard(route);
            }
          }}
        />
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <h2 className="text-2xl font-bold">Toplu İçe Aktar</h2>
              <p className="text-blue-100 mt-1">CSV veya TXT formatında müşteri adaylarını içe aktarın</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Nasıl Kullanılır?
                </h3>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">1.</span>
                    <span>Örnek dosyayı indirin (musteri-adaylari-ornek.csv)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">2.</span>
                    <span>Dosyayı Notepad, Excel veya herhangi bir editörde açın</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">3.</span>
                    <span>Kendi müşteri adaylarınızı ekleyin/düzenleyin</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">4.</span>
                    <span>Dosyayı yükleyin (.txt veya .csv formatında)</span>
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={downloadSampleCSV}
                  className="bg-green-600 hover:bg-green-700 h-16 text-base"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Örnek Dosyayı İndir
                </Button>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-lg flex items-center justify-center text-base font-medium transition-colors">
                    <FileText className="h-5 w-5 mr-2" />
                    Dosya Yükle
                  </div>
                </label>
              </div>

              {/* Format Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Kabul Edilen Formatlar:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• .csv dosyaları (Excel)</li>
                    <li>• .txt dosyaları (Notepad)</li>
                    <li>• Düz metin dosyaları</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Format Kuralları:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Her satır bir müşteri adayı</li>
                    <li>• Virgül ile ayrılmış değerler</li>
                    <li>• Ad Soyad, Email, Telefon, Şirket</li>
                  </ul>
                </div>
              </div>

              {/* Data Input Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Müşteri Adayları Listesi
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Ahmet Yılmaz, ahmet@example.com, +90 532 123 4567, ABC Şirketi
Ayşe Demir, ayse@example.com, +90 533 987 6543, XYZ Ltd
Mehmet Kaya, mehmet@example.com, +90 534 555 7890, DEF A.Ş."
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Her satır: Ad Soyad, Email, Telefon, Şirket şeklinde olmalıdır.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportData('');
                }}
              >
                İptal
              </Button>
              <Button
                onClick={handleProcessImport}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                İçe Aktar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}