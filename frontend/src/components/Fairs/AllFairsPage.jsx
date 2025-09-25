import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';

export default function AllFairsPage({ fairs: initialFairs, onBackToDashboard }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fairs, setFairs] = useState(initialFairs || []);
  const [loading, setLoading] = useState(false);

  // Load fairs from database on component mount
  useEffect(() => {
    const loadFairs = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/fairs`);
        
        if (response.ok) {
          const fairsData = await response.json();
          console.log('Raw API response:', fairsData.length, 'fairs');
          console.log('First 5 fairs:', fairsData.slice(0, 5).map(f => f.name));
          // Filter out fairs with empty names
          const validFairs = fairsData.filter(fair => fair.name && fair.name.trim() !== '');
          console.log('Valid fairs after filtering:', validFairs.length);
          console.log('Valid fair names:', validFairs.map(f => f.name));
          setFairs(validFairs);
          console.log('Fairs loaded from database:', validFairs.length);
        } else {
          console.error('Failed to load fairs from API');
          // Fallback to initial fairs if API fails
          setFairs(initialFairs || []);
        }
      } catch (error) {
        console.error('Error loading fairs:', error);
        // Fallback to initial fairs if API fails
        setFairs(initialFairs || []);
      } finally {
        setLoading(false);
      }
    };

    loadFairs();
  }, [initialFairs]);

  const filteredFairs = fairs?.filter(fair =>
    fair.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fair.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fair.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalBudget = fairs?.reduce((sum, fair) => sum + fair.budget, 0) || 0;
  const totalRevenue = fairs?.reduce((sum, fair) => sum + fair.revenue, 0) || 0;
  const avgParticipants = fairs?.length ? Math.round(fairs.reduce((sum, fair) => sum + fair.participants, 0) / fairs.length) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={onBackToDashboard}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MapPin className="h-7 w-7 text-blue-600 mr-2" />
                Tüm Fuarlar
                {loading && (
                  <div className="ml-2 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
              </h1>
              <p className="text-sm text-gray-600">
                Tüm fuar etkinliklerini görüntüleyin ve yönetin 
                {!loading && ` • ${fairs.length} fuar`}
              </p>
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Excel'e Aktar</span>
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Fuar</p>
                <p className="text-3xl font-bold text-gray-900">{fairs?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Bütçe</p>
                <p className="text-3xl font-bold text-gray-900">₺{totalBudget.toLocaleString('tr-TR')}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-3xl font-bold text-gray-900">₺{totalRevenue.toLocaleString('tr-TR')}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ort. Katılımcı</p>
                <p className="text-3xl font-bold text-gray-900">{avgParticipants}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Fuar adı, lokasyon, kategori ara..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                <span>Filtrele</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {filteredFairs.length} fuar bulundu
            </div>
          </div>
        </div>

        {/* Fairs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuar Bilgileri
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih & Lokasyon
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Katılımcı
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bütçe/Gelir
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFairs.map((fair) => (
                  <tr key={fair.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{fair.name}</div>
                        <div className="text-sm text-gray-500">{fair.organizer}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                          {fair.startDate} - {fair.endDate}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {fair.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {fair.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {fair.participants}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">₺{fair.budget.toLocaleString('tr-TR')}</div>
                        <div className="text-sm text-green-600">₺{fair.revenue.toLocaleString('tr-TR')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        fair.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {fair.status === 'active' ? 'Aktif' : 'Tamamlandı'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}