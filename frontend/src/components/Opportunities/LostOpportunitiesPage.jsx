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
  XCircle,
  TrendingDown,
  BarChart,
  TrendingUp,
  List,
  Zap
} from 'lucide-react';
import { lostOpportunities, tagColors } from '../../mock/opportunitiesData';

export default function LostOpportunitiesPage({ onBackToDashboard }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('lostDate');

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

  const getReasonStats = () => {
    const reasonStats = {};
    filteredOpportunities.forEach(opp => {
      const reason = opp.lostReason || 'Belirtilmemiş';
      reasonStats[reason] = (reasonStats[reason] || 0) + 1;
    });
    return reasonStats;
  };

  const getTotalLostValue = () => {
    return filteredOpportunities.reduce((total, opp) => total + (opp.amount || 0), 0);
  };

  const getAverageLostValue = () => {
    const total = getTotalLostValue();
    return filteredOpportunities.length > 0 ? total / filteredOpportunities.length : 0;
  };

  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toFixed(0);
  };

  const getReasonCounts = () => {
    const reasonCounts = {};
    filteredOpportunities.forEach(opp => {
      const reason = opp.lostReason || 'Bilinmeyen';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    return reasonCounts;
  };

  const filteredOpportunities = useMemo(() => {
    let filtered = lostOpportunities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(opp =>
        opp.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.lostReason && opp.lostReason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Tag search filter
    if (tagSearch) {
      filtered = filtered.filter(opp =>
        opp.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()))
      );
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(opp => opp.currency === currencyFilter);
    }

    // Lost reason filter
    if (reasonFilter !== 'all') {
      filtered = filtered.filter(opp => {
        const reason = opp.lostReason || 'Bilinmeyen';
        return reason.includes(reasonFilter);
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
      filtered = filtered.filter(opp => opp.lostDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(opp => opp.lostDate <= dateTo);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'lostDate':
          return new Date(b.lostDate) - new Date(a.lostDate);
        case 'amount':
          return b.amount - a.amount;
        case 'customer':
          return a.customer.localeCompare(b.customer);
        case 'reason':
          return (a.lostReason || '').localeCompare(b.lostReason || '');
        default:
          return b.id - a.id;
      }
    });

    return filtered;
  }, [searchTerm, tagSearch, currencyFilter, reasonFilter, countryFilter, dateFrom, dateTo, sortBy]);

  const currencyCounts = getCurrencyCounts();
  const reasonStats = getReasonStats();
  const totalLostValue = getTotalLostValue();
  const averageLostValue = getAverageLostValue();

  const clearFilters = () => {
    setSearchTerm('');
    setTagSearch('');
    setCurrencyFilter('all');
    setReasonFilter('all');
    setCountryFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('lostDate');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <span>Kaybedilen Fırsatlar</span>
            </h1>
            <p className="text-gray-600 mt-1">Kaçırılan fırsatlar ve analiz edilmesi gereken durumlar</p>
          </div>
          <div className="flex items-center space-x-3">
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
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Kaybedilen</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredOpportunities.length}</p>
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
                  <p className="text-sm font-medium text-gray-600">Kaybedilen Değer</p>
                  <p className="text-2xl font-bold text-gray-900">₺{formatAmount(totalLostValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <BarChart className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ortalama Kayıp</p>
                  <p className="text-2xl font-bold text-gray-900">₺{formatAmount(averageLostValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <List className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Kayıp Nedeni Sayısı</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(reasonStats).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-6">
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
                  placeholder="Müşteri, etkinlik, kişi veya kayıp nedeni ara..."
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

              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kayıp nedeni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Nedenler</SelectItem>
                  <SelectItem value="Bütçe">Bütçe Sorunları</SelectItem>
                  <SelectItem value="Fiyat">Fiyat Rekabeti</SelectItem>
                  <SelectItem value="Geç">Geç Yanıt</SelectItem>
                  <SelectItem value="Teknoloji">Teknoloji Uyumsuzluğu</SelectItem>
                  <SelectItem value="Karar">Karar Problemleri</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lostDate">Kayıp Tarihine Göre</SelectItem>
                  <SelectItem value="amount">Tutara Göre</SelectItem>
                  <SelectItem value="customer">Müşteriye Göre</SelectItem>
                  <SelectItem value="reason">Kayıp Nedenine Göre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                <span className="text-red-600 font-bold">{filteredOpportunities.length}</span> kaybedilen fırsat bulundu
              </span>
              {(searchTerm || tagSearch || currencyFilter !== 'all' || reasonFilter !== 'all' || sortBy !== 'lostDate') && (
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
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span>Kaybedilen Fırsatlar Listesi</span>
            </CardTitle>
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
                                Kayıp tarihi: {formatDate(opportunity.lostDate)}<br/>
                                {opportunity.competitor && `Rakip: ${opportunity.competitor}`}
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
                          <span className="font-semibold text-red-600 text-sm">
                            {formatCurrency(opportunity.amount, opportunity.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px] px-2 py-1 max-w-[120px] truncate">
                          {opportunity.lostReason || 'Kaybedildi'}
                        </Badge>
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
                  <XCircle className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Kaybedilen fırsat bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Arama kriterlerinize uygun kaybedilen fırsat bulunmamaktadır.
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