import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '../../hooks/use-toast';
import { getPassiveCustomers, formatDate, getCustomerStatistics } from '../../utils/customerStatus';
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
  UserX,
  Users,
  TrendingDown,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function InactiveCustomersPage({ customers = [], onBackToDashboard }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('monthsSinceLastInvoice');
  const [invoices, setInvoices] = useState([]);
  const [passiveCustomers, setPassiveCustomers] = useState([]);

  // Load invoices from localStorage
  useEffect(() => {
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    setInvoices(savedInvoices);
  }, []);

  // Calculate passive customers whenever customers or invoices change
  useEffect(() => {
    const passive = getPassiveCustomers(customers, invoices);
    setPassiveCustomers(passive);
  }, [customers, invoices]);

  // Modal states - placeholder for future implementation
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Filter and sort passive customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...passiveCustomers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sector filter
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(customer => customer.sector === sectorFilter);
    }

    // Apply country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(customer => customer.country === countryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'monthsSinceLastInvoice':
          return b.statusInfo.monthsSinceLastInvoice - a.statusInfo.monthsSinceLastInvoice;
        case 'companyName':
          return a.companyName.localeCompare(b.companyName, 'tr');
        case 'totalRevenue':
          return (b.totalRevenue || 0) - (a.totalRevenue || 0);
        default:
          return b.statusInfo.monthsSinceLastInvoice - a.statusInfo.monthsSinceLastInvoice;
      }
    });

    return filtered;
  }, [passiveCustomers, searchTerm, sectorFilter, countryFilter, sortBy]);

  // Get statistics
  const stats = getCustomerStatistics(customers, invoices);

  // Get unique sectors and countries for filters
  const uniqueSectors = [...new Set(passiveCustomers.map(c => c.sector).filter(Boolean))];
  const uniqueCountries = [...new Set(passiveCustomers.map(c => c.country).filter(Boolean))];

  const getInitials = (name) => {
    return name?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'MŞ';
  };

  const filteredCustomers = useMemo(() => {
    let filtered = inactiveCustomers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.sector && customer.sector.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.notes && customer.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Tag search filter
    if (tagSearch) {
      filtered = filtered.filter(customer =>
        customer.tags && customer.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()))
      );
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
        case 'inactiveSince':
          return new Date(b.inactiveSince) - new Date(a.inactiveSince);
        case 'lastActivity':
          return new Date(b.lastActivity) - new Date(a.lastActivity);
        default:
          return new Date(b.inactiveSince) - new Date(a.inactiveSince);
      }
    });

    return filtered;
  }, [searchTerm, tagSearch, sectorFilter, countryFilter, relationshipFilter, sortBy]);

  const sectorCounts = getSectorCounts();
  const countryCounts = getCountryCounts();

  const clearFilters = () => {
    setSearchTerm('');
    setTagSearch('');
    setSectorFilter('all');
    setCountryFilter('all');
    setRelationshipFilter('all');
    setSortBy('inactiveSince');
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

  const getRelationshipBadge = (type) => {
    switch (type) {
      case 'customer':
        return <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px] px-2 py-1">Eski Müşteri</Badge>;
      case 'potential_customer':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[10px] px-2 py-1">Potansiyel</Badge>;
      case 'supplier':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-[10px] px-2 py-1">Eski Tedarikçi</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-[10px] px-2 py-1">Belirsiz</Badge>;
    }
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

  const handleAction = (action, customer) => {
    if (action === 'reactivate') {
      toast({
        title: "Müşteri Yeniden Aktifleştiriliyor",
        description: `${customer.companyName} yeniden aktif hale getiriliyor`,
      });
    } else {
      toast({
        title: `${action} işlemi`,
        description: `${customer.companyName} için ${action} işlemi başlatıldı.`,
      });
    }
  };

  const exportToExcel = () => {
    toast({
      title: "Excel Aktarımı",
      description: `${filteredCustomers.length} pasif müşteri Excel dosyasına aktarılıyor...`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <UserX className="h-8 w-8 text-red-600" />
              <span>Pasif Müşteriler</span>
            </h1>
            <p className="text-gray-600 mt-1">Aktif olmayan ve yeniden kazanılması gereken müşteriler</p>
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
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pasif Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">{inactiveCustomers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Kayıp Gelir</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(inactiveCustomers.reduce((sum, c) => sum + c.totalRevenue, 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ort. Pasif Süre</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(inactiveCustomers.reduce((sum, c) => {
                      const inactiveMonths = (new Date() - new Date(c.inactiveSince)) / (1000 * 60 * 60 * 24 * 30);
                      return sum + inactiveMonths;
                    }, 0) / inactiveCustomers.length)} ay
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Potansiyel Değer</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(inactiveCustomers.reduce((sum, c) => sum + c.totalRevenue, 0) / inactiveCustomers.length / 1000)}K
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtreler ve Arama</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Şirket, kişi, e-posta, notlar ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Input
                  placeholder="Tag ara (örn: TECH)..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />
              </div>

              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sektör filtrele" />
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

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ülke filtrele" />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="İlişki türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İlişkiler</SelectItem>
                  <SelectItem value="customer">Eski Müşteri</SelectItem>
                  <SelectItem value="potential_customer">Potansiyel Müşteri</SelectItem>
                  <SelectItem value="supplier">Eski Tedarikçi</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactiveSince">Pasiflik Tarihine Göre</SelectItem>
                  <SelectItem value="companyName">Şirket Adına Göre</SelectItem>
                  <SelectItem value="revenue">Gelire Göre</SelectItem>
                  <SelectItem value="lastActivity">Son Aktiviteye Göre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                <span className="text-red-600 font-bold">{filteredCustomers.length}</span> pasif müşteri bulundu
              </span>
              {(searchTerm || tagSearch || sectorFilter !== 'all' || countryFilter !== 'all' || relationshipFilter !== 'all' || sortBy !== 'inactiveSince') && (
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
          <CardHeader>
            <CardTitle className="text-lg">Pasif Müşteri Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">No.</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Şirket</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">İletişim</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Sektör</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Durum</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Pasif Süre</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Etiketler</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 text-xs">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr 
                      key={customer.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-medium text-blue-600 text-sm">#{customer.id}</span>
                      </td>
                      
                      <td className="py-3 px-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-150 text-sm max-w-[120px] truncate">
                                  {customer.companyName}
                                </div>
                                <div className="text-xs text-gray-500 max-w-[120px] truncate">
                                  {customer.country}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {customer.companyName}<br/>
                                Pasif: {formatDate(customer.inactiveSince)}<br/>
                                Son aktivite: {formatDate(customer.lastActivity)}<br/>
                                Not: {customer.notes}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-600 text-white text-[10px]">
                              {customer.contactPerson.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 text-xs max-w-[100px] truncate">
                              {customer.contactPerson}
                            </div>
                            <div className="text-xs text-gray-500 max-w-[100px] truncate">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-900 text-sm max-w-[100px] truncate">
                          {customer.sector || 'Belirtilmemiş'}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        {getRelationshipBadge(customer.relationshipType)}
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="text-sm text-red-600 font-medium">
                            {Math.round((new Date() - new Date(customer.inactiveSince)) / (1000 * 60 * 60 * 24 * 30))} ay
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(customer.inactiveSince)}
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

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                  onClick={() => handleAction('reactivate', customer)}
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Yeniden Aktifleştir</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                  <UserX className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Pasif müşteri bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Arama kriterlerinize uygun pasif müşteri bulunmamaktadır.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}