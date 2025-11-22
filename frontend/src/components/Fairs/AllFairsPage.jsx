import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download,
  MapPin,
  Calendar,
  Users,
  Globe,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';

export default function AllFairsPage({ fairs: initialFairs, onBackToDashboard }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fairs, setFairs] = useState(initialFairs || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFairs();
  }, []);

  const loadFairs = async () => {
    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/projects/fairs/all`);
      
      if (response.ok) {
        const fairsData = await response.json();
        console.log('RAW fairsData:', fairsData.slice(0, 2)); // Debug first 2 fairs
        const validFairs = fairsData.filter(fair => fair.name && fair.name.trim() !== '');
        setFairs(validFairs);
        console.log('Fairs loaded:', validFairs.length);
        console.log('Sample fair:', validFairs[0]); // Debug structure
      } else {
        console.error('Failed to load fairs');
        setFairs(initialFairs || []);
      }
    } catch (error) {
      console.error('Error loading fairs:', error);
      setFairs(initialFairs || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredFairs = fairs.filter(fair =>
    fair.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fair.defaultCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fair.defaultCountry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFairs = filteredFairs.length;
  const totalCustomers = filteredFairs.reduce((sum, f) => sum + (f.customerCount || 0), 0);
  const totalProjects = filteredFairs.reduce((sum, f) => sum + (f.projectCount || 0), 0);
  const avgParticipants = totalFairs > 0 ? Math.round(totalCustomers / totalFairs) : 0;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToDashboard}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Tüm Fuarlar</h1>
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Excel'e Aktar</span>
          </button>
        </div>

        <p className="text-gray-600">Tüm fuar etkinliklerini görüntüleyin ve yönetin • {totalFairs} fuar</p>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Fuar</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalFairs}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Müşteri</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalCustomers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Proje</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalProjects}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ort. Katılımcı</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{avgParticipants}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Fuar adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tüm Şehirler</option>
                {[...new Set(fairs.map(f => f.defaultCity || f.city).filter(Boolean))].sort().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ülke</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tüm Ülkeler</option>
                {[...new Set(fairs.map(f => f.defaultCountry || f.country).filter(Boolean))].sort().map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ay</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tüm Aylar</option>
                <option value="1">Ocak</option>
                <option value="2">Şubat</option>
                <option value="3">Mart</option>
                <option value="4">Nisan</option>
                <option value="5">Mayıs</option>
                <option value="6">Haziran</option>
                <option value="7">Temmuz</option>
                <option value="8">Ağustos</option>
                <option value="9">Eylül</option>
                <option value="10">Ekim</option>
                <option value="11">Kasım</option>
                <option value="12">Aralık</option>
              </select>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredFairs.length} fuar bulundu
        </div>

        {/* Fairs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Yükleniy or...</p>
            </div>
          ) : filteredFairs.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz fuar eklenmemiş'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FUAR BİLGİLERİ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TARİH & LOKASYON
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ŞEHİR
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ÜLKE
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MÜŞTERİ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PERİYOD
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SÜRE
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İŞLEMLER
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFairs.map((fair) => (
                    <tr key={fair.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{fair.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {fair.defaultCity || fair.city || 'Şehir belirtilmemiş'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600 mt-1" />
                          <div>
                            {(fair.defaultStartDate || fair.startDate) && (fair.defaultEndDate || fair.endDate) ? (
                              <>
                                <div className="text-sm text-gray-900">
                                  {formatDate(fair.defaultStartDate || fair.startDate)}
                                </div>
                                <div className="text-sm text-gray-900">
                                  {formatDate(fair.defaultEndDate || fair.endDate)}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">Tarih belirtilmemiş</div>
                            )}
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {fair.defaultCity || fair.city || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {fair.defaultCity || fair.city || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center text-sm text-gray-900">
                          <Globe className="h-4 w-4 mr-2 text-gray-400" />
                          {fair.defaultCountry || fair.country || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <Users className="h-4 w-4 mr-1" />
                          {fair.customerCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Aktif
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <Edit className="h-4 w-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}