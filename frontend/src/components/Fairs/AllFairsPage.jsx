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
  const [previewFair, setPreviewFair] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showUpdateDateModal, setShowUpdateDateModal] = useState(false);
  const [selectedFair, setSelectedFair] = useState(null);
  const [updateDates, setUpdateDates] = useState({ startDate: '', endDate: '', year: '' });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.relative')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Preview fair
  const handlePreview = (fair) => {
    setPreviewFair(fair);
    setShowPreviewModal(true);
  };

  // Delete fair
  const handleDelete = async (fair) => {
    // Check if fair has any linked records
    if (fair.customerCount > 0) {
      alert('Bu fuara bağlı müşteri kayıtları var! Fuar silinemez.');
      return;
    }

    if (!window.confirm(`"${fair.name}" fuarını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/fairs/${fair.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Fuar başarıyla silindi!');
        fetchFairs(); // Refresh list
      } else {
        alert('Fuar silinemedi!');
      }
    } catch (error) {
      console.error('Error deleting fair:', error);
      alert('Bir hata oluştu!');
    }
  };

  // Update dates
  const handleUpdateDates = (fair) => {
    setSelectedFair(fair);
    setUpdateDates({
      startDate: fair.defaultStartDate || fair.startDate || '',
      endDate: fair.defaultEndDate || fair.endDate || ''
    });
    setShowUpdateDateModal(true);
  };

  const submitUpdateDates = async () => {
    if (!updateDates.startDate || !updateDates.endDate) {
      alert('Lütfen her iki tarihi de doldurun!');
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/fairs/${selectedFair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedFair,
          startDate: updateDates.startDate,
          endDate: updateDates.endDate,
          defaultStartDate: updateDates.startDate,
          defaultEndDate: updateDates.endDate
        })
      });

      if (response.ok) {
        alert('Tarihler başarıyla güncellendi!');
        setShowUpdateDateModal(false);
        fetchFairs(); // Refresh list
      } else {
        alert('Tarihler güncellenemedi!');
      }
    } catch (error) {
      console.error('Error updating dates:', error);
      alert('Bir hata oluştu!');
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
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
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      FUAR BİLGİLERİ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      TARİH & LOKASYON
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      ŞEHİR
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                      ÜLKE
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                      MÜŞTERİ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      PERİYOD
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                      SÜRE
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                      İŞLEMLER
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredFairs.map((fair, index) => (
                    <tr key={fair.id} className={`hover:bg-blue-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:shadow-sm`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{fair.name}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {fair.defaultCity || fair.city || 'Şehir belirtilmemiş'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            {(fair.defaultStartDate || fair.startDate) && (fair.defaultEndDate || fair.endDate) ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(fair.defaultStartDate || fair.startDate)}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(fair.defaultEndDate || fair.endDate)}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500 italic">Tarih belirtilmemiş</div>
                            )}
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {fair.defaultCity || fair.city || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                            <MapPin className="h-3 w-3 text-white" />
                          </div>
                          {fair.defaultCity || fair.city || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center text-sm font-medium text-gray-900">
                          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-3">
                            <Globe className="h-3 w-3 text-white" />
                          </div>
                          {fair.defaultCountry || fair.country || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 shadow-sm">
                          <Users className="h-4 w-4 mr-2" />
                          {fair.customerCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex px-3 py-2 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                          {fair.cycle === 'yearly' ? 'Her Yıl' : 
                           fair.cycle === '6_months' ? '6 Ayda Bir' :
                           fair.cycle === '2_years' ? '2 Yılda Bir' :
                           fair.cycle === '3_years' ? '3 Yılda Bir' :
                           fair.cycle || 'Belirtilmemiş'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="text-sm font-bold">
                          {(() => {
                            const startDate = new Date(fair.defaultStartDate || fair.startDate);
                            const today = new Date();
                            const diffTime = startDate - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays < 0) {
                              return <span className="inline-flex px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">Geçti</span>;
                            } else if (diffDays === 0) {
                              return <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">Bugün</span>;
                            } else if (diffDays === 1) {
                              return <span className="inline-flex px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">1 gün</span>;
                            } else {
                              return <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">{diffDays} gün</span>;
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Preview */}
                          <button 
                            onClick={() => handlePreview(fair)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-200"
                            title="Ön İzleme"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                          
                          {/* Edit - Navigate to edit page */}
                          <button 
                            onClick={() => window.location.hash = `#/edit-fair/${fair.id}`}
                            className="p-2 hover:bg-green-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-green-200"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </button>
                          
                          {/* More Menu */}
                          <div className="relative">
                            <button 
                              onClick={() => setOpenMenuId(openMenuId === fair.id ? null : fair.id)}
                              className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-md border border-transparent hover:border-gray-200"
                              title="Daha Fazla"
                            >
                              <MoreHorizontal className="h-4 w-4 text-gray-600" />
                            </button>
                            
                            {openMenuId === fair.id && (
                              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 z-10 overflow-hidden">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleUpdateDates(fair);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center space-x-2"
                                >
                                  <Calendar className="h-4 w-4" />
                                  <span>Tarihleri Güncelle</span>
                                </button>
                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleDelete(fair);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center space-x-2"
                                >
                                  <span className="text-red-500">🗑️</span>
                                  <span>Sil</span>
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* Preview Modal */}
      {showPreviewModal && previewFair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{previewFair.name}</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Ülke</p>
                    <p className="font-medium">{previewFair.defaultCountry || previewFair.country || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Şehir</p>
                    <p className="font-medium">{previewFair.defaultCity || previewFair.city || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fuar Merkezi</p>
                  <p className="font-medium">{previewFair.fairCenter || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Yıl</p>
                  <p className="font-medium">{previewFair.year || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Başlangıç Tarihi</p>
                    <p className="font-medium">{previewFair.defaultStartDate || previewFair.startDate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bitiş Tarihi</p>
                    <p className="font-medium">{previewFair.defaultEndDate || previewFair.endDate || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Periyod</p>
                  <p className="font-medium">
                    {previewFair.cycle === 'yearly' ? 'Her Yıl' : 
                     previewFair.cycle === '6_months' ? '6 Ayda Bir' :
                     previewFair.cycle === '2_years' ? '2 Yılda Bir' :
                     previewFair.cycle === '3_years' ? '3 Yılda Bir' :
                     previewFair.cycle || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fuar Ayı</p>
                  <p className="font-medium">{previewFair.fairMonth || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Sektör</p>
                  <p className="font-medium">{previewFair.sector || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Açıklama</p>
                  <p className="font-medium">{previewFair.description || '-'}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Dates Modal */}
      {showUpdateDateModal && selectedFair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Tarihleri Güncelle</h2>
                <button
                  onClick={() => setShowUpdateDateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={updateDates.startDate}
                    onChange={(e) => setUpdateDates({ ...updateDates, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={updateDates.endDate}
                    onChange={(e) => setUpdateDates({ ...updateDates, endDate: e.target.value })}
                    min={updateDates.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpdateDateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  İptal
                </button>
                <button
                  onClick={submitUpdateDates}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}