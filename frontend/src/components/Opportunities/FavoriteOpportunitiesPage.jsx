import React, { useState, useMemo, useEffect } from 'react';
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
  Heart,
  Star,
  Crown,
  Zap,
  BarChart,
  List,
  TrendingUp
} from 'lucide-react';
import { favoriteOpportunities, tagColors } from '../../mock/opportunitiesData';

export default function FavoriteOpportunitiesPage({ onBackToDashboard }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('priority');

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

  const getPriorityStats = () => {
    const priorityStats = {
      VIP: 0,
      Strategic: 0,
      Elite: 0,
      High: 0,
      Growth: 0,
      Total: filteredOpportunities.length
    };
    
    filteredOpportunities.forEach(opp => {
      if (opp.priority && priorityStats.hasOwnProperty(opp.priority)) {
        priorityStats[opp.priority]++;
      }
    });
    
    return priorityStats;
  };

  const getTotalValue = () => {
    return filteredOpportunities.reduce((total, opp) => total + (opp.amount || 0), 0);
  };

  const getAverageValue = () => {
    const total = getTotalValue();
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'VIP':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'Strategic':
        return <Star className="h-3 w-3 text-purple-500" />;
      case 'High':
        return <Star className="h-3 w-3 text-blue-500" />;
      case 'Elite':
        return <Crown className="h-3 w-3 text-indigo-500" />;
      default:
        return <Heart className="h-3 w-3 text-red-500" />;
    }
  };

  const filteredOpportunities = useMemo(() => {
    let filtered = favoriteOpportunities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(opp =>
        opp.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.priority && opp.priority.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (opp.relationship && opp.relationship.toLowerCase().includes(searchTerm.toLowerCase()))
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

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(opp => opp.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(opp => opp.status.includes(statusFilter));
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
        case 'priority':
          const priorityOrder = { 'VIP': 5, 'Strategic': 4, 'Elite': 3, 'High': 2, 'Growth': 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'amount':
          return b.amount - a.amount;
        case 'customer':
          return a.customer.localeCompare(b.customer);
        case 'lastUpdate':
          return new Date(b.lastUpdate) - new Date(a.lastUpdate);
        default:
          return b.id - a.id;
      }
    });

    return filtered;
  }, [searchTerm, tagSearch, currencyFilter, priorityFilter, statusFilter, countryFilter, dateFrom, dateTo, sortBy]);

  const currencyCounts = getCurrencyCounts();
  const priorityStats = getPriorityStats();
  const totalValue = getTotalValue();
  const averageValue = getAverageValue();

  const clearFilters = () => {
    setSearchTerm('');
    setTagSearch('');
    setCurrencyFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setCountryFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('priority');
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
              <Heart className="h-8 w-8 text-red-600" />
              <span>Favori Fırsatlar</span>
            </h1>
            <p className="text-gray-600 mt-1">Öncelikli ve stratejik öneme sahip fırsatlar</p>
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
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Crown className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">VIP Fırsatlar</p>
                  <p className="text-2xl font-bold text-gray-900">{priorityStats.VIP}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Stratejik</p>
                  <p className="text-2xl font-bold text-gray-900">{priorityStats.Strategic}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Değer</p>
                  <p className="text-2xl font-bold text-gray-900">₺{formatAmount(totalValue)}</p>
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
                  <p className="text-sm font-medium text-gray-600">Ortalama Değer</p>
                  <p className="text-2xl font-bold text-gray-900">₺{formatAmount(averageValue)}</p>
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
                  placeholder="Müşteri, etkinlik, kişi veya öncelik ara..."
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

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <Star className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Öncelik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Öncelikler</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Strategic">Stratejik</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                  <SelectItem value="High">Yüksek</SelectItem>
                  <SelectItem value="Growth">Büyüme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="negotiation">Müzakere</SelectItem>
                  <SelectItem value="quote">Teklif</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Önceliğe Göre</SelectItem>
                  <SelectItem value="amount">Tutara Göre</SelectItem>
                  <SelectItem value="customer">Müşteriye Göre</SelectItem>
                  <SelectItem value="lastUpdate">Son Güncellemeye Göre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                <span className="text-red-600 font-bold">{filteredOpportunities.length}</span> favori fırsat bulundu
              </span>
              {(searchTerm || tagSearch || currencyFilter !== 'all' || priorityFilter !== 'all' || sortBy !== 'priority') && (
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
            <CardTitle className="text-lg">Favori Fırsatlar Listesi</CardTitle>
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
                              <div className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-150 text-sm max-w-[100px] truncate flex items-center space-x-1">
                                {getPriorityIcon(opportunity.priority)}
                                <span>{opportunity.customer}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {opportunity.customer}<br/>
                                Öncelik: {opportunity.priority}<br/>
                                İlişki: {opportunity.relationship}
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
                          <span className="font-semibold text-purple-600 text-sm">
                            {formatCurrency(opportunity.amount, opportunity.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3">
                        <Badge 
                          className={`text-[10px] px-2 py-1 ${
                            opportunity.priority === 'VIP' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            opportunity.priority === 'Strategic' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            opportunity.priority === 'Elite' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                            'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {opportunity.priority}
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
                  <Heart className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Favori fırsat bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Arama kriterlerinize uygun favori fırsat bulunmamaktadır.
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