import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  X
} from 'lucide-react';

export default function AllFairsPageNew({ fairs: initialFairs, onBackToDashboard, title = "Tüm Fuarlar", titleColor = "text-gray-900", showImport = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fairs, setFairs] = useState(initialFairs || []);
  const [loading, setLoading] = useState(false);
  const [cityFilter, setCityFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [previewFair, setPreviewFair] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fairToDelete, setFairToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (initialFairs === undefined) {
      loadFairs();
    }
  }, [initialFairs]);

  const loadFairs = async () => {
    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/fairs`);
      
      if (response.ok) {
        const fairsData = await response.json();
        setFairs(fairsData);
      } else {
        setFairs(initialFairs || []);
      }
    } catch (error) {
      console.error('Error loading fairs:', error);
      setFairs(initialFairs || []);
    } finally {
      setLoading(false);
    }
  };

  // Preview fair
  const handlePreview = (fair) => {
    setPreviewFair(fair);
    setShowPreviewModal(true);
  };

  // Edit fair
  const handleEdit = (fair) => {
    setEditFormData({
      id: fair.id,
      name: fair.name,
      year: fair.year || '',
      country: fair.defaultCountry || fair.country || '',
      city: fair.defaultCity || fair.city || '',
      fairCenter: fair.fairCenter || '',
      startDate: fair.defaultStartDate || fair.startDate || '',
      endDate: fair.defaultEndDate || fair.endDate || '',
      cycle: fair.cycle || '',
      fairMonth: fair.fairMonth || ''
    });
    setShowEditModal(true);
  };

  // Delete fair
  const handleDeleteClick = (fair) => {
    if (fair.customerCount > 0) {
      setErrorMessage('Bu fuara bağlı müşteri kayıtları var! Fuar silinemez.');
      setShowErrorModal(true);
      return;
    }

    setFairToDelete(fair);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/fairs/${fairToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setSuccessMessage('Fuar başarıyla silindi!');
        setShowSuccessModal(true);
        loadFairs();
      } else {
        setShowDeleteConfirm(false);
        setErrorMessage('Fuar silinemedi!');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error deleting fair:', error);
      setShowDeleteConfirm(false);
      setErrorMessage('Bir hata oluştu!');
      setShowErrorModal(true);
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/fairs/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSuccessMessage('Fuar başarıyla güncellendi!');
        setShowSuccessModal(true);
        loadFairs();
      } else {
        setErrorMessage('Güncelleme başarısız!');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error updating fair:', error);
      setErrorMessage('Bir hata oluştu!');
      setShowErrorModal(true);
    }
  };

  // Import functions
  const handleManualInput = (text) => {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      const data = [];

      for (let line of lines) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 4) {
          data.push({
            name: parts[0] || '',
            year: parts[1] || '',
            country: parts[2] || '',
            city: parts[3] || '',
            fairCenter: parts[4] || '',
            startDate: parts[5] || '',
            endDate: parts[6] || '',
            cycle: parts[7] || 'yearly',
            fairMonth: parts[8] || ''
          });
        }
      }

      setImportPreview(data);
    } catch (error) {
      console.error('Parse error:', error);
      setErrorMessage('Veri formatı hatalı!');
      setShowErrorModal(true);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        handleManualInput(text);
      } catch (error) {
        console.error('Parse error:', error);
        setErrorMessage('Dosya formatı hatalı!');
        setShowErrorModal(true);
      }
    };

    reader.readAsText(file);
  };

  const submitImport = async () => {
    if (importPreview.length === 0) {
      setErrorMessage('Lütfen önce bir dosya yükleyin!');
      setShowErrorModal(true);
      return;
    }

    setImporting(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/fairs/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fairs: importPreview })
      });

      if (response.ok) {
        const result = await response.json();
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview([]);
        setSuccessMessage(`${result.count || importPreview.length} fuar başarıyla içe aktarıldı!`);
        setShowSuccessModal(true);
        loadFairs();
      } else {
        const errorData = await response.json();
        setErrorMessage(`İçe aktarma başarısız: ${errorData.detail || ''}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Import error:', error);
      setErrorMessage('Bir hata oluştu!');
      setShowErrorModal(true);
    } finally {
      setImporting(false);
    }
  };

  const filteredFairs = useMemo(() => {
    let filtered = fairs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(fair =>
        fair.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fair.defaultCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fair.defaultCountry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // City filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(fair => 
        (fair.defaultCity || fair.city) === cityFilter
      );
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(fair => 
        (fair.defaultCountry || fair.country) === countryFilter
      );
    }

    // Month filter
    if (monthFilter !== 'all') {
      filtered = filtered.filter(fair => {
        const startDate = new Date(fair.defaultStartDate || fair.startDate);
        return (startDate.getMonth() + 1).toString() === monthFilter;
      });
    }

    return filtered;
  }, [fairs, searchTerm, cityFilter, countryFilter, monthFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setCountryFilter('all');
    setMonthFilter('all');
  };

  const totalFairs = filteredFairs.length;
  const totalCustomers = filteredFairs.reduce((sum, f) => sum + (f.customerCount || 0), 0);
  const totalProjects = filteredFairs.reduce((sum, f) => sum + (f.projectCount || 0), 0);
  const avgParticipants = totalFairs > 0 ? Math.round(totalCustomers / totalFairs) : 0;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '-';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const year = start.getFullYear();
    
    return `${startDay}-${endDay}.${month}.${year}`;
  };

  const getCityCounts = () => {
    const counts = {};
    fairs.forEach(fair => {
      const city = fair.defaultCity || fair.city;
      if (city) {
        counts[city] = (counts[city] || 0) + 1;
      }
    });
    return counts;
  };

  const getCountryCounts = () => {
    const counts = {};
    fairs.forEach(fair => {
      const country = fair.defaultCountry || fair.country;
      if (country) {
        counts[country] = (counts[country] || 0) + 1;
      }
    });
    return counts;
  };

  const cityCounts = getCityCounts();
  const countryCounts = getCountryCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Fuarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToDashboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${titleColor}`}>{title}</h1>
              <p className="text-gray-600 mt-1">
                {title === "Gelecek Fuarlar" ? "Yaklaşan ve aktif fuar etkinliklerini görüntüleyin" : 
                 title === "Geçmiş Fuarlar" ? "Tamamlanmış fuar etkinliklerini görüntüleyin" :
                 "Tüm fuar etkinliklerini görüntüleyin ve yönetin"} • {totalFairs} fuar
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              İçe Aktar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              Excel'e Aktar
            </button>
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Fuar</p>
                <p className="text-2xl font-bold text-gray-900">{totalFairs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Proje</p>
                <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ort. Katılımcı</p>
                <p className="text-2xl font-bold text-gray-900">{avgParticipants}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filtreler ve Arama</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Fuar adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Ülkeler</option>
              {Object.entries(countryCounts).sort().map(([country, count]) => (
                <option key={country} value={country}>{country} ({count})</option>
              ))}
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Şehirler</option>
              {Object.entries(cityCounts).sort().map(([city, count]) => (
                <option key={city} value={city}>{city} ({count})</option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Aylar</option>
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

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              <span className="text-blue-600 font-bold">{filteredFairs.length}</span> fuar bulundu
            </span>
            {(searchTerm || cityFilter !== 'all' || countryFilter !== 'all' || monthFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>

        {/* Fairs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tüm Fuarlar Listesi</h3>
          </div>
          
          {filteredFairs.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-600">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz fuar eklenmemiş'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs">No.</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs">Fuar Adı</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs">Ülke</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs">Şehir</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs">Tarih</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-xs">Yıl</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-xs">Müşteri</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs">Periyod</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-xs">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFairs.map((fair, index) => (
                    <tr 
                      key={fair.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-blue-600 text-sm">{index + 1}</span>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 text-sm max-w-[200px] truncate">
                          {fair.name}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-700">
                          {fair.defaultCountry || fair.country || '-'}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-700">
                          {fair.defaultCity || fair.city || '-'}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-700">
                          {formatDateRange(
                            fair.defaultStartDate || fair.startDate,
                            fair.defaultEndDate || fair.endDate
                          )}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {fair.year || '-'}
                        </span>
                      </td>
                      
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          {fair.customerCount || 0}
                        </span>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-700">
                          {fair.cycle === 'yearly' ? 'Her Yıl' : 
                           fair.cycle === '6_months' ? '6 Ayda Bir' :
                           fair.cycle === '2_years' ? '2 Yılda Bir' :
                           fair.cycle === '3_years' ? '3 Yılda Bir' :
                           fair.cycle || '-'}
                        </span>
                      </td>
                      
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handlePreview(fair)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEdit(fair)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteClick(fair)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Preview Modal */}
      {showPreviewModal && previewFair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Fuar Detayları</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fuar Adı</label>
                <p className="mt-1 text-sm text-gray-900">{previewFair.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ülke</label>
                  <p className="mt-1 text-sm text-gray-900">{previewFair.defaultCountry || previewFair.country || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şehir</label>
                  <p className="mt-1 text-sm text-gray-900">{previewFair.defaultCity || previewFair.city || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fuar Merkezi</label>
                <p className="mt-1 text-sm text-gray-900">{previewFair.fairCenter || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(previewFair.defaultStartDate || previewFair.startDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(previewFair.defaultEndDate || previewFair.endDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Yıl</label>
                  <p className="mt-1 text-sm text-gray-900">{previewFair.year || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Periyod</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {previewFair.cycle === 'yearly' ? 'Her Yıl' : 
                     previewFair.cycle === '6_months' ? '6 Ayda Bir' :
                     previewFair.cycle === '2_years' ? '2 Yılda Bir' :
                     previewFair.cycle === '3_years' ? '3 Yılda Bir' :
                     previewFair.cycle || '-'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Müşteri Sayısı</label>
                  <p className="mt-1 text-sm text-gray-900">{previewFair.customerCount || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proje Sayısı</label>
                  <p className="mt-1 text-sm text-gray-900">{previewFair.projectCount || 0}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Fuar Düzenle</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuar Adı</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ülke</label>
                  <input
                    type="text"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuar Merkezi</label>
                <input
                  type="text"
                  value={editFormData.fairCenter}
                  onChange={(e) => setEditFormData({...editFormData, fairCenter: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({...editFormData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({...editFormData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yıl</label>
                  <input
                    type="text"
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({...editFormData, year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periyod</label>
                  <select
                    value={editFormData.cycle}
                    onChange={(e) => setEditFormData({...editFormData, cycle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="yearly">Her Yıl</option>
                    <option value="6_months">6 Ayda Bir</option>
                    <option value="2_years">2 Yılda Bir</option>
                    <option value="3_years">3 Yılda Bir</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && fairToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Fuar Sil</h2>
              <p className="text-gray-600 mb-6">
                "{fairToDelete.name}" fuarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Başarılı</h2>
              </div>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Hata</h2>
              </div>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Fuar İçe Aktar</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Manual Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manuel Veri Girişi (Her satıra bir fuar)
                </label>
                <textarea
                  rows="8"
                  placeholder="Fuar verilerini buraya yapıştırın...&#10;Format: FuarAdı | Yıl | Ülke | Şehir | FuarMerkezi | BaşlangıçTarihi | BitişTarihi | Periyod | Ay&#10;&#10;Örnek:&#10;A3 Business Forum | 2026 | ABD | Orlando | Orange County Convention Center | 19-21.01.2026 | 21-21.01.2026 | yearly | 01"
                  onChange={(e) => handleManualInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              {/* OR Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">VEYA</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosya Seç (TXT formatında)
                </label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Format Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Veri Formatı:</h4>
                <p className="text-xs text-blue-800 font-mono">
                  FuarAdı | Yıl | Ülke | Şehir | FuarMerkezi | BaşlangıçTarihi | BitişTarihi | Periyod | Ay
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  • Her satıra bir fuar bilgisi<br/>
                  • Alanlar "|" karakteri ile ayrılmalı<br/>
                  • Tarih formatı: GG-GG.AA.YYYY (örn: 19-21.01.2026)<br/>
                  • Periyod: yearly, 6_months, 2_years, 3_years
                </p>
              </div>

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Önizleme ({importPreview.length} fuar)
                  </h3>
                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left text-gray-600">No</th>
                          <th className="px-2 py-2 text-left text-gray-600">Fuar Adı</th>
                          <th className="px-2 py-2 text-left text-gray-600">Yıl</th>
                          <th className="px-2 py-2 text-left text-gray-600">Ülke</th>
                          <th className="px-2 py-2 text-left text-gray-600">Şehir</th>
                          <th className="px-2 py-2 text-left text-gray-600">Tarih</th>
                          <th className="px-2 py-2 text-left text-gray-600">Periyod</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((fair, index) => (
                          <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-2 py-2">{index + 1}</td>
                            <td className="px-2 py-2 font-medium">{fair.name}</td>
                            <td className="px-2 py-2">{fair.year}</td>
                            <td className="px-2 py-2">{fair.country}</td>
                            <td className="px-2 py-2">{fair.city}</td>
                            <td className="px-2 py-2">{fair.startDate} - {fair.endDate}</td>
                            <td className="px-2 py-2">
                              {fair.cycle === 'yearly' ? 'Her Yıl' : 
                               fair.cycle === '6_months' ? '6 Ayda Bir' :
                               fair.cycle === '2_years' ? '2 Yılda Bir' :
                               fair.cycle === '3_years' ? '3 Yılda Bir' :
                               fair.cycle || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={submitImport}
                disabled={importing || importPreview.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    İçe Aktarılıyor...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {importPreview.length} Fuar İçe Aktar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
