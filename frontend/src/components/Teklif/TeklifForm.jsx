import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Building, Users, FileText, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TeklifForm = ({ onBackToDashboard, showToast }) => {
  // Form data state
  const [formData, setFormData] = useState({
    satisFiresatId: '',
    musteriId: '',
    teklifBaslik: '',
    teklifTarihi: new Date().toISOString().split('T')[0],
    gecerlilikTarihi: '',
    notlar: ''
  });

  // Data states
  const [satisFiresatlari, setSatisFiresatlari] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [secilenMusteri, setSecilenMusteri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load satış fırsatları from backend
  const loadSatisFiresatlari = async () => {
    try {
      console.log('🔍 Loading satış fırsatları from:', `${BACKEND_URL}/api/opportunities`);
      const response = await fetch(`${BACKEND_URL}/api/opportunities`);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status);
        throw new Error('Satış fırsatları yüklenirken hata oluştu');
      }
      const data = await response.json();
      console.log('✅ Satış fırsatları loaded:', data);
      console.log('📊 Number of opportunities:', data.length);
      setSatisFiresatlari(data);
    } catch (error) {
      console.error('❌ Error loading satış fırsatları:', error);
      setError('Satış fırsatları yüklenirken hata oluştu: ' + error.message);
    }
  };

  // Load müşteriler from backend
  const loadMusteriler = async () => {
    try {
      console.log('🔍 Loading müşteriler from:', `${BACKEND_URL}/api/customers`);
      const response = await fetch(`${BACKEND_URL}/api/customers`);
      console.log('📡 Customers response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ Customers response not OK:', response.status);
        throw new Error('Müşteriler yüklenirken hata oluştu');
      }
      const data = await response.json();
      console.log('✅ Müşteriler loaded:', data);
      console.log('📊 Number of customers:', data.length);
      setMusteriler(data);
    } catch (error) {
      console.error('❌ Error loading müşteriler:', error);
      setError('Müşteriler yüklenirken hata oluştu: ' + error.message);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 TeklifForm useEffect triggered - loading data...');
    loadSatisFiresatlari();
    loadMusteriler();
  }, []);

  // Debug: log state changes
  useEffect(() => {
    console.log('📊 Satış fırsatları state updated:', satisFiresatlari.length, 'items');
  }, [satisFiresatlari]);

  useEffect(() => {
    console.log('👥 Müşteriler state updated:', musteriler.length, 'items');
  }, [musteriler]);

  // Handle satış fırsatı selection
  const handleSatisFiresatChange = (satisFiresatId) => {
    setFormData(prev => ({
      ...prev,
      satisFiresatId: satisFiresatId,
      musteriId: '' // Reset müşteri when changing satış fırsatı
    }));
    
    if (satisFiresatId) {
      // Find selected satış fırsatı
      const secilenFiresat = satisFiresatlari.find(f => f.id === satisFiresatId);
      
      if (secilenFiresat && secilenFiresat.customer_id) {
        // Find associated müşteri
        const ilgiliMusteri = musteriler.find(m => m.id === secilenFiresat.customer_id);
        
        if (ilgiliMusteri) {
          setFormData(prev => ({
            ...prev,
            musteriId: ilgiliMusteri.id,
            teklifBaslik: `${secilenFiresat.title || secilenFiresat.name} - Teklif`
          }));
          setSecilenMusteri(ilgiliMusteri);
          
          // if (showToast) {
          //   showToast({
          //     type: 'info',
          //     title: 'Müşteri Otomatik Seçildi',
          //     text: `${ilgiliMusteri.company_name} otomatik olarak seçildi.`
          //   });
          // }
        }
      }
    } else {
      setSecilenMusteri(null);
    }
  };

  // Handle müşteri selection
  const handleMusteriChange = (musteriId) => {
    setFormData(prev => ({
      ...prev,
      musteriId: musteriId
    }));
    
    if (musteriId) {
      const musteri = musteriler.find(m => m.id === musteriId);
      setSecilenMusteri(musteri);
    } else {
      setSecilenMusteri(null);
    }
  };

  // Test data function - fills all fields with realistic data
  const fillTestData = () => {
    // Select first available satış fırsatı if exists
    if (satisFiresatlari.length > 0) {
      const randomFiresat = satisFiresatlari[Math.floor(Math.random() * satisFiresatlari.length)];
      handleSatisFiresatChange(randomFiresat.id);
      
      // Find associated customer
      const ilgiliMusteri = musteriler.find(m => m.id === randomFiresat.customer_id);
      
      // Calculate valid dates
      const today = new Date();
      const validUntil = new Date();
      validUntil.setDate(today.getDate() + 30); // 30 days validity
      
      // Test data with real company names
      const testTitles = [
        'Kurumsal Stand Tasarım Teklifi',
        'Fuar Katılım Hizmetleri Teklifi',
        'Özel Stand Yapım Teklifi',
        'Modüler Stand Kiralama Teklifi',
        'VIP Stand Tasarım ve Uygulama Teklifi',
        'Grafik Tasarım ve Baskı Hizmetleri Teklifi'
      ];
      
      const testNotes = [
        'Teklif kapsamında stand tasarımı, imalat, kurulum ve söküm işlemleri dahildir. Elektrik ve aydınlatma malzemeleri dahildir.',
        'Fuara özel hazırlanan bu teklif, premium malzemeler ve profesyonel kurulum ekibi içermektedir. 7/24 teknik destek sağlanacaktır.',
        'Modüler sistem kullanılarak hazırlanan standımız, farklı fuarlarda yeniden kullanılabilir özelliktedir.',
        'Teklif, 3D tasarım çizimleri, onay sonrası üretim ve montaj hizmetlerini kapsamaktadır.',
        'Stand projesi, müşteri logolarının entegrasyonu ve özel grafik uygulamalarını içermektedir.'
      ];
      
      setFormData({
        satisFiresatId: randomFiresat.id,
        musteriId: ilgiliMusteri ? ilgiliMusteri.id : (musteriler.length > 0 ? musteriler[0].id : ''),
        teklifBaslik: testTitles[Math.floor(Math.random() * testTitles.length)],
        teklifTarihi: today.toISOString().split('T')[0],
        gecerlilikTarihi: validUntil.toISOString().split('T')[0],
        notlar: testNotes[Math.floor(Math.random() * testNotes.length)]
      });
      
      if (ilgiliMusteri) {
        setSecilenMusteri(ilgiliMusteri);
      } else if (musteriler.length > 0) {
        setSecilenMusteri(musteriler[0]);
      }
      
      console.log('✅ Test verisi dolduruldu');
    } else {
      alert('Test verisi doldurmak için önce satış fırsatı ve müşteri verisi gereklidir.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.satisFiresatId || !formData.musteriId) {
      alert('Lütfen satış fırsatı ve müşteri seçiniz.');
      return;
    }

    setLoading(true);
    try {
      // Here would be the API call to create the teklif
      console.log('Teklif Form Data:', formData);
      
      alert('Teklif başarıyla oluşturuldu.');

      // Reset form or navigate back
      onBackToDashboard();
      
    } catch (error) {
      console.error('Error creating teklif:', error);
      alert('Teklif oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToDashboard}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Geri Dön</span>
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Teklif Oluştur</h1>
            <p className="text-gray-600 mt-2">
              Satış fırsatı seçerek yeni bir teklif oluşturun
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-600 text-sm">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Satış Fırsatı ve Müşteri Seçimi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Temel Bilgiler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Satış Fırsatı Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satış Fırsatı *
                </label>
                <select
                  value={formData.satisFiresatId}
                  onChange={(e) => handleSatisFiresatChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Satış fırsatı seçiniz...</option>
                  {satisFiresatlari.map(firsat => (
                    <option key={firsat.id} value={firsat.id}>
                      {firsat.title || firsat.name} - {firsat.company_name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {satisFiresatlari.length} satış fırsatı bulundu
                </div>
              </div>

              {/* Müşteri Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri *
                </label>
                <select
                  value={formData.musteriId}
                  onChange={(e) => handleMusteriChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Müşteri seçiniz...</option>
                  {musteriler.map(musteri => (
                    <option key={musteri.id} value={musteri.id}>
                      {musteri.company_name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {musteriler.length} müşteri bulundu
                  {secilenMusteri && (
                    <span className="text-blue-600 ml-2">
                      → Seçilen: {secilenMusteri.company_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Seçilen Müşteri Detayları */}
              {secilenMusteri && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Seçilen Müşteri Bilgileri</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Şirket:</span>
                        <span className="ml-2 text-gray-900">{secilenMusteri.company_name}</span>
                      </div>
                      {secilenMusteri.contact_person && (
                        <div>
                          <span className="font-medium text-gray-700">İletişim Kişisi:</span>
                          <span className="ml-2 text-gray-900">{secilenMusteri.contact_person}</span>
                        </div>
                      )}
                      {secilenMusteri.email && (
                        <div>
                          <span className="font-medium text-gray-700">E-posta:</span>
                          <span className="ml-2 text-gray-900">{secilenMusteri.email}</span>
                        </div>
                      )}
                      {secilenMusteri.phone && (
                        <div>
                          <span className="font-medium text-gray-700">Telefon:</span>
                          <span className="ml-2 text-gray-900">{secilenMusteri.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            </CardContent>
          </Card>

          {/* Teklif Detayları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Teklif Detayları</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Teklif Başlığı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teklif Başlığı *
                </label>
                <input
                  type="text"
                  value={formData.teklifBaslik}
                  onChange={(e) => setFormData(prev => ({...prev, teklifBaslik: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Teklif başlığını giriniz..."
                  required
                />
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teklif Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.teklifTarihi}
                    onChange={(e) => setFormData(prev => ({...prev, teklifTarihi: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geçerlilik Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.gecerlilikTarihi}
                    onChange={(e) => setFormData(prev => ({...prev, gecerlilikTarihi: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar
                </label>
                <textarea
                  value={formData.notlar}
                  onChange={(e) => setFormData(prev => ({...prev, notlar: e.target.value}))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Teklif ile ilgili notlarınızı giriniz..."
                />
              </div>

            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onBackToDashboard}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Oluşturuluyor...' : 'Teklif Oluştur'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TeklifForm;