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
  X
} from 'lucide-react';
import { openOpportunities, opportunityStatusOptions, tagColors } from '../../mock/opportunitiesData';

export default function OpenOpportunitiesPage({ onBackToDashboard, opportunities }) {
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

  // Use opportunities from props, fallback to imported data
  const opportunitiesData = opportunities || openOpportunities;

  const getCurrencyCounts = () => {
    const counts = { EUR: 0, USD: 0, TRY: 0 };
    
    // Apply all filters except currency filter to get base filtered results
    let baseFiltered = opportunitiesData;

    // Search filter
    if (searchTerm) {
      baseFiltered = baseFiltered.filter(opportunity =>
        opportunity.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tag search filter
    if (tagSearch) {
      baseFiltered = baseFiltered.filter(opportunity =>
        opportunity.tags.some(tag => 
          tag.toLowerCase().includes(tagSearch.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity => 
        opportunity.status === statusFilter
      );
    }

    // Amount filter
    if (amountFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity => {
        const amount = opportunity.amount;
        switch (amountFilter) {
          case '0-5000':
            return amount >= 0 && amount <= 5000;
          case '5000-15000':
            return amount > 5000 && amount <= 15000;
          case '15000-30000':
            return amount > 15000 && amount <= 30000;
          case '30000+':
            return amount > 30000;
          case 'no-amount':
            return amount === 0;
          default:
            return true;
        }
      });
    }

    // Country filter
    if (countryFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity =>
        opportunity.tags.includes(countryFilter)
      );
    }

    // Date range filter
    if (dateFrom) {
      baseFiltered = baseFiltered.filter(opportunity =>
        new Date(opportunity.lastUpdate) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      baseFiltered = baseFiltered.filter(opportunity =>
        new Date(opportunity.lastUpdate) <= new Date(dateTo)
      );
    }

    // Count by currency
    baseFiltered.forEach(opportunity => {
      if (counts.hasOwnProperty(opportunity.currency)) {
        counts[opportunity.currency]++;
      }
    });

    return counts;
  };

  const getCountryCounts = () => {
    const countries = ['ALMANYA', 'TÜRKİYE', 'ABD', 'BAE', 'KANADA'];
    const counts = {};
    
    // Apply all filters except country filter
    let baseFiltered = opportunitiesData;

    if (searchTerm) {
      baseFiltered = baseFiltered.filter(opportunity =>
        opportunity.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tagSearch) {
      baseFiltered = baseFiltered.filter(opportunity =>
        opportunity.tags.some(tag => 
          tag.toLowerCase().includes(tagSearch.toLowerCase())
        )
      );
    }

    if (statusFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity => 
        opportunity.status === statusFilter
      );
    }

    if (currencyFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity => 
        opportunity.currency === currencyFilter
      );
    }

    if (amountFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity => {
        const amount = opportunity.amount;
        switch (amountFilter) {
          case '0-5000': return amount >= 0 && amount <= 5000;
          case '5000-15000': return amount > 5000 && amount <= 15000;
          case '15000-30000': return amount > 15000 && amount <= 30000;
          case '30000+': return amount > 30000;
          case 'no-amount': return amount === 0;
          default: return true;
        }
      });
    }

    if (dateFrom) {
      baseFiltered = baseFiltered.filter(opportunity =>
        new Date(opportunity.lastUpdate) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      baseFiltered = baseFiltered.filter(opportunity =>
        new Date(opportunity.lastUpdate) <= new Date(dateTo)
      );
    }

    countries.forEach(country => {
      counts[country] = baseFiltered.filter(opportunity =>
        opportunity.tags.includes(country)
      ).length;
    });

    return counts;
  };

  const countryCounts = getCountryCounts();

  const getAmountCounts = () => {
    const ranges = ['0-5000', '5000-15000', '15000-30000', '30000+', 'no-amount'];
    const counts = {};
    
    // Apply all filters except amount filter
    let baseFiltered = opportunitiesData;

    if (searchTerm) {
      baseFiltered = baseFiltered.filter(opportunity =>
        opportunity.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tagSearch) {
      baseFiltered = baseFiltered.filter(opportunity =>
        opportunity.tags.some(tag => 
          tag.toLowerCase().includes(tagSearch.toLowerCase())
        )
      );
    }

    if (statusFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity => 
        opportunity.status === statusFilter
      );
    }

    if (currencyFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity => 
        opportunity.currency === currencyFilter
      );
    }

    if (countryFilter !== 'all') {
      baseFiltered = baseFiltered.filter(opportunity =>
        opportunity.tags.includes(countryFilter)
      );
    }

    if (dateFrom) {
      baseFiltered = baseFiltered.filter(opportunity =>
        new Date(opportunity.lastUpdate) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      baseFiltered = baseFiltered.filter(opportunity =>
        new Date(opportunity.lastUpdate) <= new Date(dateTo)
      );
    }

    ranges.forEach(range => {
      counts[range] = baseFiltered.filter(opportunity => {
        const amount = opportunity.amount;
        switch (range) {
          case '0-5000': return amount >= 0 && amount <= 5000;
          case '5000-15000': return amount > 5000 && amount <= 15000;
          case '15000-30000': return amount > 15000 && amount <= 30000;
          case '30000+': return amount > 30000;
          case 'no-amount': return amount === 0;
          default: return true;
        }
      }).length;
    });

    return counts;
  };

  const amountCounts = getAmountCounts();

  const currencyCounts = getCurrencyCounts();

  // Action handlers
  const handleViewOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setViewModalOpen(true);
  };

  const handleEditOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setEditModalOpen(true);
  };

  const handleUpdateOpportunity = (updatedOpportunity) => {
    // This would normally update the database
    // For now, we'll just show a success message
    console.log('Opportunity updated:', updatedOpportunity);
    toast({
      title: "Başarılı",
      description: "Satış fırsatı başarıyla güncellendi",
    });
  };

  const handleActionMenu = (action, opportunity) => {
    switch (action) {
      case 'delete':
        toast({
          title: "Silme İşlemi",
          description: `${opportunity.customer} fırsatı silme işlemi başlatıldı`,
          variant: "destructive"
        });
        break;
      case 'share':
        toast({
          title: "Paylaşım",
          description: `${opportunity.customer} fırsatı paylaşıma hazırlandı`,
        });
        break;
      case 'comment':
        toast({
          title: "Yorum Ekle",
          description: `${opportunity.customer} fırsatına yorum ekleme`,
        });
        break;
      case 'event':
        toast({
          title: "Etkinlik Oluştur",
          description: `${opportunity.customer} için etkinlik oluşturuluyor`,
        });
        break;
      case 'message':
        toast({
          title: "Mesaj Gönder",
          description: `${opportunity.customer} ile mesajlaşma başlatılıyor`,
        });
        break;
      case 'email':
        toast({
          title: "E-posta Gönder",
          description: `${opportunity.customer} için e-posta hazırlanıyor`,
        });
        break;
      default:
        break;
    }
  };

  const clearAllFilters = () => {
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

  const filteredOpportunities = useMemo(() => {
    let filtered = opportunitiesData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(opportunity =>
        opportunity.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tag search filter
    if (tagSearch) {
      filtered = filtered.filter(opportunity =>
        opportunity.tags.some(tag => 
          tag.toLowerCase().includes(tagSearch.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(opportunity => 
        opportunity.status === statusFilter
      );
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(opportunity => 
        opportunity.currency === currencyFilter
      );
    }

    // Amount filter
    if (amountFilter !== 'all') {
      filtered = filtered.filter(opportunity => {
        const amount = opportunity.amount;
        switch (amountFilter) {
          case '0-5000':
            return amount >= 0 && amount <= 5000;
          case '5000-15000':
            return amount > 5000 && amount <= 15000;
          case '15000-30000':
            return amount > 15000 && amount <= 30000;
          case '30000+':
            return amount > 30000;
          case 'no-amount':
            return amount === 0;
          default:
            return true;
        }
      });
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(opportunity =>
        opportunity.tags.includes(countryFilter)
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(opportunity =>
        new Date(opportunity.lastUpdate) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(opportunity =>
        new Date(opportunity.lastUpdate) <= new Date(dateTo)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'customer':
          return a.customer.localeCompare(b.customer);
        case 'amount':
          return b.amount - a.amount;
        case 'date':
          return new Date(b.lastUpdate) - new Date(a.lastUpdate);
        default:
          return b.id - a.id;
      }
    });

    return filtered;
  }, [opportunitiesData, searchTerm, tagSearch, statusFilter, currencyFilter, amountFilter, countryFilter, dateFrom, dateTo, sortBy]);

  const formatCurrency = (amount, currency) => {
    if (amount === 0) return '-';
    
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'TRY': '₺'
    };

    return `${symbols[currency] || currency} ${amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadgeColor = (statusText) => {
    if (statusText.includes('Teklif Bekleniyor')) return 'bg-yellow-100 text-yellow-800';
    if (statusText.includes('Teklif Gönderildi')) return 'bg-blue-100 text-blue-800';
    if (statusText.includes('Tasarım')) return 'bg-purple-100 text-purple-800';
    if (statusText.includes('Brief')) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Eye className="h-8 w-8 text-blue-600" />
              <span>Açık Fırsatlar</span>
            </h1>
            <p className="text-gray-600 mt-1">Aktif satış fırsatlarınızı yönetin</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <FileText className="h-4 w-4 mr-2" />
              Rapor Al
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters and Search */}
      <div className="px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Gelişmiş Arama ve Filtreler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* First Row - Main Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Müşteri adı, etkinlik adı veya kişi adı ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              
              <div className="relative">
                <Input
                  placeholder="Etiketlerde ara (ör: ALMANYA, MEDICA...)"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Second Row - Status and Sort Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Durum filtrele" />
                </SelectTrigger>
                <SelectContent>
                  {opportunityStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={`px-2 py-1 rounded-full text-xs ${option.color}`}>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">No'ya Göre (Yeniden Eskiye)</SelectItem>
                  <SelectItem value="customer">Müşteri Adına Göre (A-Z)</SelectItem>
                  <SelectItem value="amount">Tutara Göre (Yüksekten Düşüğe)</SelectItem>
                  <SelectItem value="date">Tarihe Göre (Yeni Güncelleme)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="h-11">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Para Birimi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Para Birimleri ({currencyCounts.EUR + currencyCounts.USD + currencyCounts.TRY})</SelectItem>
                  <SelectItem value="EUR">EUR (€) ({currencyCounts.EUR})</SelectItem>
                  <SelectItem value="USD">USD ($) ({currencyCounts.USD})</SelectItem>
                  <SelectItem value="TRY">TRY (₺) ({currencyCounts.TRY})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Tutar Aralığı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tutarlar ({amountCounts['0-5000'] + amountCounts['5000-15000'] + amountCounts['15000-30000'] + amountCounts['30000+'] + amountCounts['no-amount']})</SelectItem>
                  <SelectItem value="0-5000">0 - 5.000 ({amountCounts['0-5000']})</SelectItem>
                  <SelectItem value="5000-15000">5.000 - 15.000 ({amountCounts['5000-15000']})</SelectItem>
                  <SelectItem value="15000-30000">15.000 - 30.000 ({amountCounts['15000-30000']})</SelectItem>
                  <SelectItem value="30000+">30.000+ ({amountCounts['30000+']})</SelectItem>
                  <SelectItem value="no-amount">Tutar Girilmemiş ({amountCounts['no-amount']})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Third Row - Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Ülke Filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Ülkeler ({countryCounts['ALMANYA'] + countryCounts['TÜRKİYE'] + countryCounts['ABD'] + countryCounts['BAE'] + countryCounts['KANADA']})</SelectItem>
                  <SelectItem value="ALMANYA">Almanya ({countryCounts['ALMANYA']})</SelectItem>
                  <SelectItem value="TÜRKİYE">Türkiye ({countryCounts['TÜRKİYE']})</SelectItem>
                  <SelectItem value="ABD">Amerika Birleşik Devletleri ({countryCounts['ABD']})</SelectItem>
                  <SelectItem value="BAE">Birleşik Arap Emirlikleri ({countryCounts['BAE']})</SelectItem>
                  <SelectItem value="KANADA">Kanada ({countryCounts['KANADA']})</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  placeholder="Başlangıç Tarihi"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  placeholder="Bitiş Tarihi"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Results and Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  <span className="text-blue-600 font-bold">{filteredOpportunities.length}</span> fırsat bulundu
                </span>
                {(searchTerm || tagSearch || statusFilter !== 'all' || currencyFilter !== 'all' || amountFilter !== 'all' || countryFilter !== 'all' || dateFrom || dateTo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Filtreleri Temizle
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Excel'e Aktar
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Kayıtlı Filtreler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities Table */}
      <div className="px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Açık Fırsatlar Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Müşteri</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">İsim</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Tutar</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Durum</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">İletişim</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Etiketler</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">İşlemler</th>
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
                      <td className="py-4 px-4">
                        <span className="font-medium text-blue-600">#{opportunity.id}</span>
                      </td>
                      
                      <td className="py-4 px-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-150">
                                {opportunity.customer}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">
                                Son güncelleme: {formatDate(opportunity.lastUpdate)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">
                          {opportunity.eventName}
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(opportunity.amount, opportunity.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <Badge className={`${getStatusBadgeColor(opportunity.statusText)} border-0`}>
                          {opportunity.statusText}
                        </Badge>
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                              {opportunity.contactPerson.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {opportunity.contactPerson}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {opportunity.tags.map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              className={`text-[10px] px-1.5 py-0.5 ${tagColors[tag] || 'bg-gray-500 text-white'} border-0`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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
                  <Eye className="h-12 w-12" />
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
    </div>
  );
}