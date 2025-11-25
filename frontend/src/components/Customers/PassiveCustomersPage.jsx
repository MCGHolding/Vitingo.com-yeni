import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar,
  User,
  FileText,
  UserX,
  Users,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function PassiveCustomersPage({ customers = [], onBackToDashboard, refreshCustomers }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Filter passive customers
  const passiveCustomers = useMemo(() => {
    return customers.filter(customer => customer.status === 'passive');
  }, [customers]);

  // Filter and sort passive customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...passiveCustomers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.contactPerson && customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sector filter
    if (sectorFilter && sectorFilter !== 'all') {
      filtered = filtered.filter(customer => customer.sector === sectorFilter);
    }

    // Country filter
    if (countryFilter && countryFilter !== 'all') {
      filtered = filtered.filter(customer => customer.country === countryFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'revenue':
          return (b.totalRevenue || 0) - (a.totalRevenue || 0);
        case 'orders':
          return (b.totalOrders || 0) - (a.totalOrders || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [passiveCustomers, searchTerm, sectorFilter, countryFilter, sortBy]);

  // Get unique sectors and countries for filters
  const uniqueSectors = [...new Set(passiveCustomers.map(c => c.sector).filter(Boolean))];
  const uniqueCountries = [...new Set(passiveCustomers.map(c => c.country).filter(Boolean))];

  const handleActivateCustomer = async (customer) => {
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
        throw new Error('Failed to activate customer');
      }

      const data = await response.json();
      
      toast({
        title: "Müşteri Aktif Hale Getirildi",
        description: data.message,
      });

      // Refresh the customers list
      if (typeof refreshCustomers === 'function') {
        await refreshCustomers();
      }
    } catch (error) {
      console.error('Error activating customer:', error);
      toast({
        title: "Hata",
        description: "Müşteri aktif hale getirilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'XX';
  };

  const formatCurrency = (amount, currency = 'TRY') => {
    if (!amount) return '0 ₺';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <UserX className="h-6 w-6" />
            <span>Pasif Müşteriler</span>
          </h1>
          <p className="text-gray-600 mt-1">Son 3 ayda hareket görmemiş müşteriler</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pasif Müşteriler</p>
                <p className="text-2xl font-bold text-gray-900">{passiveCustomers.length}</p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Ciro</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(passiveCustomers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-gray-900">
                  {passiveCustomers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Müşteri Ara</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="İsim, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sektör</label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Sektörler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sektörler</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Ülke</label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Ülkeler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Ülkeler</SelectItem>
                  {uniqueCountries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sıralama</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">İsim</SelectItem>
                  <SelectItem value="revenue">Ciro</SelectItem>
                  <SelectItem value="orders">Sipariş Sayısı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardContent className="pt-6">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Pasif müşteri bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-red-100 text-red-600">
                          {getInitials(customer.companyName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{customer.companyName}</h3>
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            Pasif
                          </Badge>
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          {customer.contactPerson && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{customer.contactPerson}</span>
                            </div>
                          )}
                          {customer.sector && (
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">Sektör:</span>
                              <span>{customer.sector}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center space-x-6 text-sm">
                          <div>
                            <span className="text-gray-500">Ciro:</span>
                            <span className="ml-2 font-medium">{formatCurrency(customer.totalRevenue)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Sipariş:</span>
                            <span className="ml-2 font-medium">{customer.totalOrders || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivateCustomer(customer)}
                      className="text-green-600 hover:text-green-800 hover:bg-green-50"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Aktif Yap
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
