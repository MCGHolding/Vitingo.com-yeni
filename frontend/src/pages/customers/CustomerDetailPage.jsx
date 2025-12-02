import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { tenantSlug, customerId } = useParams();
  const { tenant } = useTenant();
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend URL - Always use env variable, ignore window.ENV override
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                    'https://bank-router.preview.emergentagent.com';

  // Müşteri detayını yükle
  useEffect(() => {
    const loadCustomer = async () => {
      // Eğer customerId "yeni", "pasif", "favoriler", "adaylar" ise bu detay sayfası değil
      const reservedPaths = ['yeni', 'pasif', 'favoriler', 'adaylar', 'duzenle'];
      if (reservedPaths.includes(customerId)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading customer:', customerId);
        console.log('🌐 Backend URL:', backendUrl);
        
        const response = await fetch(`${backendUrl}/api/customers/${customerId}`);
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Customer loaded:', data);
          setCustomer(data);
        } else if (response.status === 404) {
          console.log('❌ Customer not found');
          setError('Müşteri bulunamadı');
        } else {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          setError('Müşteri yüklenirken hata oluştu');
        }
      } catch (error) {
        console.error('❌ Fetch error:', error);
        setError('Bağlantı hatası: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadCustomer();
    }
  }, [customerId, backendUrl]);

  // Navigation handlers
  const handleBack = () => {
    navigate(`/${tenantSlug}/musteriler`);
  };

  const handleEdit = () => {
    navigate(`/${tenantSlug}/musteriler/${customerId}/duzenle`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Müşteri yüklen iyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">Müşteri ID: {customerId}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Müşteri Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  // No customer state
  if (!customer) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Müşteri bilgisi bulunamadı.</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Müşteri Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  // Customer detail view - Inline render (ViewCustomerPage'e bağımlı olmadan)
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.companyName || customer.name || 'Müşteri Detayı'}
            </h1>
            <p className="text-gray-500">Müşteri ID: {customer.id}</p>
          </div>
        </div>
        <button
          onClick={handleEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Düzenle</span>
        </button>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Temel Bilgiler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            Şirket Bilgileri
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Şirket Adı</label>
              <p className="font-medium text-gray-900">{customer.companyName || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Sektör</label>
              <p className="font-medium text-gray-900">{customer.sector || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Müşteri Tipi</label>
              <p className="font-medium text-gray-900">{customer.customerType || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Durum</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                customer.status === 'active' ? 'bg-green-100 text-green-800' : 
                customer.status === 'passive' ? 'bg-gray-100 text-gray-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {customer.status === 'active' ? 'Aktif' : 
                 customer.status === 'passive' ? 'Pasif' : customer.status || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            İletişim Bilgileri
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">E-posta</label>
              <p className="font-medium text-gray-900">{customer.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Telefon</label>
              <p className="font-medium text-gray-900">{customer.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Web Sitesi</label>
              <p className="font-medium text-gray-900">{customer.website || '-'}</p>
            </div>
          </div>
        </div>

        {/* Adres Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Adres Bilgileri
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Ülke</label>
              <p className="font-medium text-gray-900">{customer.country || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Şehir</label>
              <p className="font-medium text-gray-900">{customer.city || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Adres</label>
              <p className="font-medium text-gray-900">{customer.address || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notlar */}
      {customer.notes && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notlar</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
