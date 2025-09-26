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
  Star
} from 'lucide-react';
import { customerTagColors } from '../../mock/customersData';
import ViewPersonModal from './ViewPersonModal';
import EditPersonModal from './EditPersonModal';

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

  // Get customer status badge with color coding
  const getCustomerStatusBadge = (customer) => {
    // Determine status based on business logic (can be enhanced later)
    const lastActivityDate = new Date(customer.lastActivity);
    const monthsSinceLastActivity = (new Date() - lastActivityDate) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsSinceLastActivity > 6) {
      return <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px] px-2 py-1">Pasif</Badge>;
    } else if (customer.totalOrders >= 3) {
      return <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px] px-2 py-1">Aktif</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] px-2 py-1">Normal</Badge>;
    }
  };

  const getRelationshipBadge = (type) => {
    switch (type) {
      case 'customer':
        return <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px] px-2 py-1">Müşteri</Badge>;
      case 'potential_customer':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] px-2 py-1">Potansiyel</Badge>;
      case 'supplier':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] px-2 py-1">Tedarikçi</Badge>;
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
    toast({
      title: `${action} işlemi`,
      description: `${customer.companyName} için ${action} işlemi başlatıldı.`,
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
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-green-400 to-green-600 rounded-xl shadow-md">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                  <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
                  <p className="text-xs text-green-600 mt-1">↗ Sistemde kayıtlı</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Müşteri</p>
                  <p className="text-3xl font-bold text-gray-900">{customers.filter(c => c.status === 'active').length}</p>
                  <p className="text-xs text-blue-600 mt-1">📈 İşlem yapan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {customers.length > 0 ? (customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0) / 1000000).toFixed(1) : '0'}M ₺
                  </p>
                  <p className="text-xs text-purple-600 mt-1">💰 Toplam ciro</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl shadow-md">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ort. Müşteri Değeri</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0) / customers.length / 1000) : 0}K ₺
                  </p>
                  <p className="text-xs text-orange-600 mt-1">📊 Müşteri başına</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
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
                  placeholder="Şirket, kişi, e-posta, sektör ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Input
                  placeholder="Tag ara (örn: TEKNOLOJI)..."
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
                  <SelectItem value="customer">Müşteri</SelectItem>
                  <SelectItem value="potential_customer">Potansiyel Müşteri</SelectItem>
                  <SelectItem value="supplier">Tedarikçi</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="companyName">Şirket Adına Göre</SelectItem>
                  <SelectItem value="revenue">Gelire Göre</SelectItem>
                  <SelectItem value="customerSince">Müşteri Olma Tarihine Göre</SelectItem>
                  <SelectItem value="lastActivity">Son Aktiviteye Göre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                <span className="text-blue-600 font-bold">{filteredCustomers.length}</span> müşteri bulundu
              </span>
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
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Müşteri Listesi</span>
            </CardTitle>
          </CardHeader>
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
    </div>
  );
}