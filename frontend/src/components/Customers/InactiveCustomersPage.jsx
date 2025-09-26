import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { getPassiveCustomers, formatDate, getCustomerStatistics } from '../../utils/customerStatus';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar,
  User,
  DollarSign,
  FileText,
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





  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBackToDashboard}
            className="flex items-center space-x-2"
          >
            <TrendingDown className="h-4 w-4" />
            <span>Dashboard'a Dön</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <UserX className="h-8 w-8 text-orange-500" />
              <span>Pasif Müşteriler</span>
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              6 aydan uzun süredir fatura kesilmemiş müşteriler
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <UserX className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pasif Müşteri</p>
                <p className="text-2xl font-bold text-gray-900">{stats.passive}</p>
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
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif Müşteri</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active + stats.favorite}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pasiflik Oranı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0 ? Math.round((stats.passive / stats.total) * 100) : 0}%
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
                <SelectItem value="monthsSinceLastInvoice">Pasiflik Süresi</SelectItem>
                <SelectItem value="companyName">Şirket Adı</SelectItem>
                <SelectItem value="totalRevenue">Toplam Ciro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>{filteredCustomers.length} pasif müşteri bulundu</span>
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
              <UserX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pasif müşteri bulunamadı</h3>
              <p className="text-gray-600">
                {searchTerm || sectorFilter !== 'all' || countryFilter !== 'all'
                  ? 'Arama kriterlerine uygun pasif müşteri yok'
                  : 'Tüm müşterilerin fatura aktivitesi son 6 ay içinde'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map(customer => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                        {getInitials(customer.companyName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.companyName}
                        </h3>
                        <Badge className={customer.statusInfo.color}>
                          <Clock className="h-3 w-3 mr-1" />
                          {customer.statusInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{customer.contactPerson || 'Belirsiz'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Son fatura: {formatDate(customer.statusInfo.lastInvoiceDate)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{customer.statusInfo.invoiceCount} toplam fatura</span>
                        </div>
                      </div>

                      {/* Status description */}
                      <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        {customer.statusInfo.description}
                        {customer.statusInfo.monthsSinceLastInvoice > 12 && (
                          <span className="text-red-600 font-medium"> • Kritik pasiflik!</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
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