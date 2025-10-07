import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import ViewOpportunityModal from './ViewOpportunityModal';
import EditOpportunityModal from './EditOpportunityModal';
import ActionMenuPopover from './ActionMenuPopover';
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
  List,
  BarChart,
  Zap
} from 'lucide-react';
// import { allOpportunities, tagColors } from '../../mock/opportunitiesData'; // Removed - using real API

export default function AllOpportunitiesPage({ onBackToDashboard }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('id');

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  const getCurrencyCounts = () => {
    const counts = { EUR: 0, USD: 0, TRY: 0 };
    
    filteredOpportunities.forEach(opp => {
      if (counts.hasOwnProperty(opp.currency)) {
        counts[opp.currency]++;
      }
    });
    
    return counts;
  };

  const getStatusCounts = () => {
    const statusCounts = {};
    filteredOpportunities.forEach(opp => {
      const status = opp.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return statusCounts;
  };

  const getStatusBadge = (status, statusText) => {
    switch (status) {
      case 'open-active':
        return <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px] px-2 py-1 max-w-[120px] truncate">
          {statusText ? statusText.replace('Açık - Aktif - ', '') : 'Açık'}
        </Badge>;
      case 'won':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] px-2 py-1">Kazanıldı</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px] px-2 py-1">Kaybedildi</Badge>;
      case 'favorite-active':
      case 'favorite-pending':
      case 'favorite-negotiation':
      case 'favorite-quote':
      case 'favorite-design':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] px-2 py-1">Favori</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-[10px] px-2 py-1">Bilinmiyor</Badge>;
    }
  };

  const filteredOpportunities = useMemo(() => {
    let filtered = allOpportunities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(opp =>
        opp.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tag search filter
    if (tagSearch) {
      filtered = filtered.filter(opp =>
        opp.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(opp => {
        switch (statusFilter) {
          case 'open':
            return opp.status === 'open-active';
          case 'won':
            return opp.status === 'won';
          case 'lost':
            return opp.status === 'lost';
          case 'favorite':
            return opp.status && opp.status.includes('favorite');
          default:
            return true;
        }
      });
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(opp => opp.currency === currencyFilter);
    }

    // Amount filter
    if (amountFilter !== 'all') {
      filtered = filtered.filter(opp => {
        const amount = opp.amount || opp.dealValue || 0;
        switch (amountFilter) {
          case 'low': return amount > 0 && amount <= 15000;
          case 'medium': return amount > 15000 && amount <= 30000;
          case 'high': return amount > 30000;
          default: return true;
        }
      });
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(opp =>
        opp.tags.some(tag => tag.toLowerCase().includes(countryFilter.toLowerCase()))
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(opp => opp.lastUpdate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(opp => opp.lastUpdate <= dateTo);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'customer':
          return a.customer.localeCompare(b.customer);
        case 'amount':
          const amountA = a.amount || a.dealValue || 0;
          const amountB = b.amount || b.dealValue || 0;
          return amountB - amountA;
        case 'lastUpdate':
          return new Date(b.lastUpdate) - new Date(a.lastUpdate);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return b.id - a.id;
      }
    });

    return filtered;
  }, [searchTerm, tagSearch, statusFilter, currencyFilter, amountFilter, countryFilter, dateFrom, dateTo, sortBy]);

  const currencyCounts = getCurrencyCounts();
  const statusCounts = getStatusCounts();

  const clearFilters = () => {
    setSearchTerm('');
    setTagSearch('');
    setStatusFilter('all');
    setCurrencyFilter('all');
    setAmountFilter('all');
    setCountryFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('id');
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

  const handleView = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setViewModalOpen(true);
  };

  const handleEdit = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setEditModalOpen(true);
  };

  const handleAction = (action, opportunity) => {
    toast({
      title: `${action} işlemi`,
      description: `${opportunity.customer} için ${action} işlemi başlatıldı.`,
    });
  };

  const exportToExcel = () => {
    toast({
      title: "Excel Aktarımı",
      description: `${filteredOpportunities.length} fırsat Excel dosyasına aktarılıyor...`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <List className="h-8 w-8 text-purple-600" />
              <span>Tüm Satış Fırsatları</span>
            </h1>
            <p className="text-gray-600 mt-1">Sistemdeki tüm fırsatların kapsamlı görünümü</p>
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Açık Fırsatlar</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['open-active'] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Kazanılan</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['won'] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Kaybedilen</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['lost'] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <List className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam</p>
                  <p className="text-2xl font-bold text-gray-900">{allOpportunities.length}</p>
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
                  placeholder="Müşteri, etkinlik veya kişi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Input
                  placeholder="Tag ara (örn: ALMANYA)..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="open">Açık Fırsatlar ({statusCounts['open-active'] || 0})</SelectItem>
                  <SelectItem value="won">Kazanılan ({statusCounts['won'] || 0})</SelectItem>
                  <SelectItem value="lost">Kaybedilen ({statusCounts['lost'] || 0})</SelectItem>
                  <SelectItem value="favorite">Favori Fırsatlar</SelectItem>
                </SelectContent>
              </Select>

              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger>
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Para birimi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Para Birimleri</SelectItem>
                  <SelectItem value="EUR">EUR ({currencyCounts.EUR})</SelectItem>
                  <SelectItem value="USD">USD ({currencyCounts.USD})</SelectItem>
                  <SelectItem value="TRY">TRY ({currencyCounts.TRY})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutar aralığı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tutarlar</SelectItem>
                  <SelectItem value="low">0 - 15,000</SelectItem>
                  <SelectItem value="medium">15,000 - 30,000</SelectItem>
                  <SelectItem value="high">30,000+</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID'ye Göre</SelectItem>
                  <SelectItem value="customer">Müşteriye Göre</SelectItem>
                  <SelectItem value="amount">Tutara Göre</SelectItem>
                  <SelectItem value="lastUpdate">Son Güncellemeye Göre</SelectItem>
                  <SelectItem value="status">Duruma Göre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                <span className="text-purple-600 font-bold">{filteredOpportunities.length}</span> fırsat bulundu
              </span>
              {(searchTerm || tagSearch || statusFilter !== 'all' || currencyFilter !== 'all' || sortBy !== 'id') && (
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

      {/* Opportunities Table */}
      <div className="px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tüm Fırsatlar Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">No.</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Müşteri</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">İsim</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Tutar</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Durum</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">İletişim</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Etiketler</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 text-xs">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opportunity, index) => (
                    <tr 
                      key={opportunity.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-medium text-blue-600 text-sm">#{opportunity.id}</span>
                      </td>
                      
                      <td className="py-3 px-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-150 text-sm max-w-[100px] truncate">
                                {opportunity.customer}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {opportunity.customer}<br/>
                                Son güncelleme: {formatDate(opportunity.lastUpdate)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-900 text-sm max-w-[140px] truncate">
                          {opportunity.eventName}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {formatCurrency(opportunity.amount || opportunity.dealValue || 0, opportunity.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        {getStatusBadge(opportunity.status, opportunity.statusText)}
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px]">
                              {opportunity.contactPerson.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 text-xs max-w-[80px] truncate">
                              {opportunity.contactPerson}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {opportunity.tags.map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              className={`text-[9px] px-1 py-0.5 ${tagColors[tag] || 'bg-gray-500 text-white'} border-0`}
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
                                  onClick={() => handleView(opportunity)}
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
                                  onClick={() => handleEdit(opportunity)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Düzenle</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <ActionMenuPopover
                            opportunity={opportunity}
                            onAction={handleAction}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOpportunities.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <List className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Fırsat bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Arama kriterlerinize uygun fırsat bulunmamaktadır.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedOpportunity && (
        <ViewOpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedOpportunity(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedOpportunity && (
        <EditOpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedOpportunity(null);
          }}
          onSave={(updatedOpportunity) => {
            toast({
              title: "Başarılı",
              description: "Fırsat bilgileri güncellendi.",
            });
            setEditModalOpen(false);
            setSelectedOpportunity(null);
          }}
        />
      )}
    </div>
  );
}