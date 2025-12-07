import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import apiClient from '../../utils/apiClient';
import { ArrowLeft, Search, MapPin, Globe, Users, Calendar } from 'lucide-react';

export default function AllFairsPage({ onBackToDashboard }) {
  const { tenantSlug } = useParams();
  const { toast } = useToast();
  const [fairs, setFairs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantSlug) {
      apiClient.setTenantSlug(tenantSlug);
    }
    loadFairs();
  }, [tenantSlug]);

  const loadFairs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getFairs();
      
      if (response && response.status === 'success') {
        const data = response.data || [];
        console.log(`✅ Loaded ${data.length} fairs from tenant-aware API`);
        console.log(`📊 Tenant: ${response.tenant?.name}`);
        setFairs(data);
      }
    } catch (error) {
      console.error('❌ Error loading fairs:', error);
      toast({
        title: "Hata",
        description: "Fuarlar yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFairs = fairs.filter(fair =>
    fair.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fair.defaultCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fair.defaultCountry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-6 w-6" />
            <span>Tüm Fuarlar</span>
          </h1>
          <p className="text-gray-600 mt-1">Kayıtlı tüm fuarlar ve proje bilgileri</p>
        </div>
        <Button variant="outline" onClick={onBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Fuar adı, şehir veya ülke ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fairs Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          ) : filteredFairs.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz fuar eklenmemiş'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fuar Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Şehir
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ülke
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarihler
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Müşteri
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFairs.map((fair) => (
                    <tr key={fair.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {fair.name}
                            </div>
                            {fair.description && (
                              <div className="text-xs text-gray-500">
                                {fair.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {fair.defaultCity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Globe className="h-4 w-4 mr-2 text-gray-400" />
                          {fair.defaultCountry}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {fair.defaultStartDate && fair.defaultEndDate ? (
                            <>
                              {formatDate(fair.defaultStartDate)} - {formatDate(fair.defaultEndDate)}
                            </>
                          ) : (
                            <span className="text-gray-400">Tarih belirtilmemiş</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <Users className="h-4 w-4 mr-1" />
                          {fair.customerCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {fair.projectCount || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredFairs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{filteredFairs.length}</p>
                <p className="text-sm text-gray-600">Toplam Fuar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {filteredFairs.reduce((sum, f) => sum + (f.customerCount || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Toplam Müşteri</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">P</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredFairs.reduce((sum, f) => sum + (f.projectCount || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Toplam Proje</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
