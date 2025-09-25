import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  FileText
} from 'lucide-react';
import { openOpportunities, opportunityStatusOptions, tagColors } from '../../mock/opportunitiesData';

export default function OpenOpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id');

  const filteredOpportunities = useMemo(() => {
    let filtered = openOpportunities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(opportunity =>
        opportunity.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(opportunity => 
        opportunity.status === statusFilter
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
  }, [searchTerm, statusFilter, sortBy]);

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

      {/* Filters and Search */}
      <div className="px-6 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Müşteri, etkinlik veya kişi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">No'ya Göre</SelectItem>
                  <SelectItem value="customer">Müşteri Adına Göre</SelectItem>
                  <SelectItem value="amount">Tutara Göre</SelectItem>
                  <SelectItem value="date">Tarihe Göre</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Toplam {filteredOpportunities.length} fırsat
                </span>
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
                        <div className="font-medium text-gray-900">
                          {opportunity.customer}
                        </div>
                        <div className="text-sm text-gray-500">
                          Son güncelleme: {formatDate(opportunity.lastUpdate)}
                        </div>
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
                              className={`text-xs px-2 py-1 ${tagColors[tag] || 'bg-gray-500 text-white'} border-0`}
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