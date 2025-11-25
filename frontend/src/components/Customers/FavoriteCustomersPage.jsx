import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { getFavoriteCustomers, formatDate, getCustomerStatistics } from '../../utils/customerStatus';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar,
  User,
  FileText,
  Heart,
  Users,
  TrendingUp,
  Star,
  Award
} from 'lucide-react';

export default function FavoriteCustomersPage({ customers = [], onBackToDashboard, refreshCustomers }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('invoicesLastYear');
  const [invoices, setInvoices] = useState([]);
  const [favoriteCustomers, setFavoriteCustomers] = useState([]);

  // Load invoices from localStorage
  useEffect(() => {
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    setInvoices(savedInvoices);
  }, []);

  // Calculate favorite customers whenever customers or invoices change
  useEffect(() => {
    // Filter customers with isFavorite: true
    const favorites = customers.filter(customer => customer.isFavorite === true);
    setFavoriteCustomers(favorites);
  }, [customers, invoices]);

  // Filter and sort favorite customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...favoriteCustomers];

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
        case 'invoicesLastYear':
          return (b.statusInfo?.invoicesLastYear || 0) - (a.statusInfo?.invoicesLastYear || 0);
        case 'companyName':
          return a.companyName.localeCompare(b.companyName, 'tr');
        case 'totalRevenue':
          return (b.totalRevenue || 0) - (a.totalRevenue || 0);
        default:
          return (b.statusInfo?.invoicesLastYear || 0) - (a.statusInfo?.invoicesLastYear || 0);
      }
    });

    return filtered;
  }, [favoriteCustomers, searchTerm, sectorFilter, countryFilter, sortBy]);

  // Get statistics
  const stats = getCustomerStatistics(customers, invoices);

  // Get unique sectors and countries for filters
  const uniqueSectors = [...new Set(favoriteCustomers.map(c => c.sector).filter(Boolean))];
  const uniqueCountries = [...new Set(favoriteCustomers.map(c => c.country).filter(Boolean))];

  const getInitials = (name) => {
    return name?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'MŞ';
  };

  const handleRemoveFromFavorites = async (customer) => {
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
        throw new Error('Failed to remove from favorites');
      }

      const data = await response.json();
      
      toast({
        title: "Favorilerden Çıkarıldı",
        description: `${customer.companyName} favorilerden çıkarıldı`,
      });

      // Refresh the customers list
      if (typeof refreshCustomers === 'function') {
        console.log('✅ Calling refreshCustomers after removing from favorites');
        await refreshCustomers();
      } else {
        console.error('❌ refreshCustomers function not available');
        toast({
          title: "Hata", 
          description: "Liste yenileme fonksiyonu bulunamadı.",
        });
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: "Hata",
        description: "Favorilerden çıkarma işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Heart className="h-8 w-8 text-red-500" />
              <span>Favori Müşteriler</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Son 1 yılda 3+ fatura ile yüksek aktivite gösteren müşteriler
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Favori Müşteri</p>
                <p className="text-2xl font-bold text-gray-900">{stats.favorite}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ortalama Fatura</p>
                <p className="text-2xl font-bold text-gray-900">
                  {favoriteCustomers.length > 0 
                    ? Math.round(favoriteCustomers.reduce((sum, c) => sum + (c.statusInfo?.invoicesLastYear || 0), 0) / favoriteCustomers.length)
                    : 0
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Favori Oranı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0 ? Math.round((stats.favorite / stats.total) * 100) : 0}%
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

            {/* Sector Filter */}
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sektör" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sektörler</SelectItem>
                {uniqueSectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
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
                {uniqueCountries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoicesLastYear">Fatura Sayısı</SelectItem>
                <SelectItem value="companyName">Şirket Adı</SelectItem>
                <SelectItem value="totalRevenue">Toplam Ciro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>{filteredCustomers.length} favori müşteri bulundu</span>
            </div>
            {(searchTerm || sectorFilter !== 'all' || countryFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSectorFilter('all');
                  setCountryFilter('all');
                }}
              >
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Favori müşteri bulunamadı</h3>
              <p className="text-gray-600">
                {searchTerm || sectorFilter !== 'all' || countryFilter !== 'all'
                  ? 'Arama kriterlerine uygun favori müşteri yok'
                  : 'Henüz yılda 3+ fatura ile favori statüsü kazanan müşteri bulunmuyor'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer, index) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Ranking Badge */}
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-red-100 text-red-700 font-semibold">
                          {getInitials(customer.companyName)}
                        </AvatarFallback>
                      </Avatar>
                      {index < 3 && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.companyName}
                        </h3>
                        {customer.statusInfo && (
                          <Badge className={customer.statusInfo.color}>
                            <Star className="h-3 w-3 mr-1" />
                            {customer.statusInfo.label}
                          </Badge>
                        )}
                        {index < 3 && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            Top {index + 1}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{customer.contactPerson || 'Belirsiz'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Son fatura: {formatDate(customer.statusInfo?.lastInvoiceDate)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{customer.statusInfo?.invoiceCount || 0} toplam fatura</span>
                        </div>
                      </div>

                      {/* Status description */}
                      {customer.statusInfo && (
                        <div className="mt-3 text-xs text-gray-500 bg-green-50 px-3 py-2 rounded">
                          <Star className="h-3 w-3 inline mr-1 text-green-500" />
                          {customer.statusInfo.description}
                          {customer.statusInfo.invoicesLastYear >= 6 && (
                            <span className="text-green-600 font-medium"> • Süper aktif müşteri!</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRemoveFromFavorites(customer)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Heart className="h-4 w-4 mr-1 fill-current" />
                      Favoriden Çıkar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}