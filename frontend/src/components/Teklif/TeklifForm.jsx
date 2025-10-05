import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { X, Plus, Calendar, Check, Minus, Edit, Save, FileText, Users, Building, MapPin, Globe, Clock, DollarSign, Package } from 'lucide-react';

const TeklifForm = ({ onBackToDashboard, showToast }) => {
  // Form data state
  const [formData, setFormData] = useState({
    teklifKonusu: '', // Satış Fırsatı ID'si
    musteriId: '',
    yetkiliKisiler: [], // Array of selected authorized persons
    teklifTarihi: new Date().toISOString().split('T')[0],
    fuarTarihi: '',
    fuarMerkezi: '',
    sehir: '',
    ulke: '',
    sablon: '',
    vadeler: [
      { sira: 1, tip: '', ozelTarih: '', yuzde: '' }
    ],
    teklifKosullari: [],
    urunHizmetler: [],
    teklifOnYazi: [],
    dahilHizmetler: [],
    haricHizmetler: [],
    imzalar: []
  });

  // Data states
  const [satisFirsatlari, setSatisFirsatlari] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [yetkiliKisiler, setYetkiliKisiler] = useState([]);
  const [sablonlar, setSablonlar] = useState([]);
  const [dahilHizmetlerVT, setDahilHizmetlerVT] = useState([
    'Standın tasarıma uygun şekilde üretilmesi',
    'Standın fuar alanına getirilmesi (Lojistik)',
    'Montaj',
    'Demontaj',
    'Fuar sonrası standın alandan kaldırılması'
  ]);
  const [haricHizmetlerVT, setHaricHizmetlerVT] = useState([
    'Elektrik Paneli',
    'Elektrik Kullanım Ücretleri',
    'Su Kullanım Ücretleri',
    'İnternet Kullanım Ücretleri',
    'Askı Halatı ve Askı Noktaları (Donanım)',
    'Truss',
    'Catering Hizmetleri',
    'Host / Hostes veya yardımcı personel',
    'Statik hesaplama ücretleri (gerekirse)',
    'Sigorta giderleri (3. taraf mali sorumluluk, mallar, vb.)',
    'Atık Ücretleri (Geri Dönüşüm)',
    'Fuar süresince stand temizliği',
    'Sökme işleminden sonra kalan stand malzemelerinin atılmasının maliyeti (Geri Dönüşüm)',
    'Atık Konteyneri Kiralama (Gerekirse)',
    'Material Handling Bedeli (Stand malzemeleri ve müşteri ürünlerinin fuar alanına alınması)',
    'Kamyon için rezervasyon ücretleri',
    'Forklift kiralama ücretleri',
    'Malzeme Taşıma ücretleri',
    'Zorunlu İşçilik ücretleri (Labour - Elektrik, Marangoz vb)',
    'Freeman ve Fuar Alanı tarafından yansıtılan tüm ücretler'
  ]);
  const [kullanicilar, setKullanicilar] = useState([]);

  // Modal states
  const [isKosulEklemeModalOpen, setIsKosulEklemeModalOpen] = useState(false);
  const [isOnYaziEklemeModalOpen, setIsOnYaziEklemeModalOpen] = useState(false);
  const [isDahilHizmetEklemeModalOpen, setIsDahilHizmetEklemeModalOpen] = useState(false);
  const [isHaricHizmetEklemeModalOpen, setIsHaricHizmetEklemeModalOpen] = useState(false);

  // Rich text editor states
  const [yeniKosul, setYeniKosul] = useState({ icerik: '', kisaAd: '' });
  const [yeniOnYazi, setYeniOnYazi] = useState({ icerik: '', kisaAd: '' });
  const [yeniDahilHizmet, setYeniDahilHizmet] = useState('');
  const [yeniHaricHizmet, setYeniHaricHizmet] = useState('');

  // Vade options
  const vadeSecenekleri = [
    'Peşin',
    'Kurulum İlk Günü',
    'Fuar Teslim Günü',
    'Fuar Söküm Günü',
    'Teslimden 1 hafta sonra',
    'Teslimden 2 hafta sonra',
    'Teslimden 1 ay sonra',
    'Özel Tarih'
  ];

  // Load data on component mount
  useEffect(() => {
    loadSatisFirsatlari();
    loadMusteriler();
    loadSablonlar();
    loadKullanicilar();
  }, []);

  const loadSatisFirsatlari = async () => {
    try {
      // TODO: API call to load sales opportunities
      setSatisFirsatlari([
        { id: '1', firsatBasligi: 'ITU Fuarı 2024 Stand Projesi', musteriId: '1', fuarTarihi: '2024-12-15', fuarMerkezi: 'Istanbul Fuar Merkezi', sehir: 'İstanbul', ulke: 'Türkiye' },
        { id: '2', firsatBasligi: 'Hannover Messe 2024', musteriId: '2', fuarTarihi: '2024-11-20', fuarMerkezi: 'Hannover Exhibition Center', sehir: 'Hannover', ulke: 'Almanya' }
      ]);
    } catch (error) {
      console.error('Satış fırsatları yüklenemedi:', error);
    }
  };

  const loadMusteriler = async () => {
    try {
      // TODO: API call to load customers
      setMusteriler([
        { id: '1', ad: 'Acme Corp', yetkiliKisiler: [
          { id: '1', ad: 'AHMET', soyad: 'YILMAZ' },
          { id: '2', ad: 'FATMA', soyad: 'KAYA' }
        ]},
        { id: '2', ad: 'Tech Solutions', yetkiliKisiler: [
          { id: '3', ad: 'MEHMET', soyad: 'ÖZ' }
        ]}
      ]);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    }
  };

  const loadSablonlar = async () => {
    try {
      // TODO: API call to load templates
      setSablonlar([
        { id: '1', ad: 'Standart Teklif Şablonu' },
        { id: '2', ad: 'Premium Teklif Şablonu' },
        { id: '3', ad: 'Özel Teklif Şablonu' }
      ]);
    } catch (error) {
      console.error('Şablonlar yüklenemedi:', error);
    }
  };

  const loadKullanicilar = async () => {
    try {
      // TODO: API call to load users
      setKullanicilar([
        { id: '1', ad: 'Murat', soyad: 'Admin' },
        { id: '2', ad: 'Ayşe', soyad: 'Tasarımcı' }
      ]);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  };

  // Handle teklif konusu change
  const handleTeklifKonusuChange = (firsatId) => {
    const seciliFirsat = satisFirsatlari.find(f => f.id === firsatId);
    if (seciliFirsat) {
      const seciliMusteri = musteriler.find(m => m.id === seciliFirsat.musteriId);
      
      setFormData(prev => ({
        ...prev,
        teklifKonusu: firsatId,
        musteriId: seciliFirsat.musteriId,
        fuarTarihi: seciliFirsat.fuarTarihi,
        fuarMerkezi: seciliFirsat.fuarMerkezi,
        sehir: seciliFirsat.sehir,
        ulke: seciliFirsat.ulke,
        yetkiliKisiler: [] // Reset authorized persons
      }));
      
      if (seciliMusteri) {
        setYetkiliKisiler(seciliMusteri.yetkiliKisiler || []);
      }
    }
  };

  // Handle yetkili kişi selection
  const handleYetkiliKisiEkle = (kisiId) => {
    const kisi = yetkiliKisiler.find(k => k.id === kisiId);
    if (kisi && !formData.yetkiliKisiler.find(y => y.id === kisiId)) {
      setFormData(prev => ({
        ...prev,
        yetkiliKisiler: [...prev.yetkiliKisiler, kisi]
      }));
    }
  };

  const handleYetkiliKisiCikar = (kisiId) => {
    setFormData(prev => ({
      ...prev,
      yetkiliKisiler: prev.yetkiliKisiler.filter(y => y.id !== kisiId)
    }));
  };

  // Handle vade operations
  const handleVadeEkle = () => {
    setFormData(prev => ({
      ...prev,
      vadeler: [...prev.vadeler, { sira: prev.vadeler.length + 1, tip: '', ozelTarih: '', yuzde: '' }]
    }));
  };

  const handleVadeSil = (index) => {
    if (formData.vadeler.length > 1) {
      setFormData(prev => ({
        ...prev,
        vadeler: prev.vadeler.filter((_, i) => i !== index)
      }));
    }
  };

  const handleVadeChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      vadeler: prev.vadeler.map((vade, i) => 
        i === index ? { ...vade, [field]: value } : vade
      )
    }));
  };

  // Generate AI teklif ön yazısı
  const generateAIOnYazi = () => {
    const seciliFirsat = satisFirsatlari.find(f => f.id === formData.teklifKonusu);
    const seciliMusteri = musteriler.find(m => m.id === formData.musteriId);
    
    if (seciliFirsat && seciliMusteri) {
      return `Değerli ${seciliMusteri.ad} Yetkilileri,

${seciliFirsat.fuarTarihi} tarihlerinde ${seciliFirsat.sehir}, ${seciliFirsat.ulke}'de ${seciliFirsat.fuarMerkezi}'nde düzenlenecek olan ${seciliFirsat.firsatBasligi} etkinliğine katılımınız için stand tasarımı ve uygulaması konusunda size teklif sunmaktan büyük memnuniyet duyuyoruz.

Firmamız, yıllardır fuar standı tasarımı ve uygulaması alanında faaliyet göstermektedir. Deneyimli ekibimiz ve kaliteli hizmet anlayışımızla, markanızı en iyi şekilde temsil edecek modern ve etkileyici stand çözümleri sunmaktayız.

Bu teklif kapsamında, standınızın tasarımından montajına, fuardan sonra söküm işlemlerine kadar tüm süreçleri profesyonel ekibimizle yönetmekteyiz.

Saygılarımızla,`;
    }
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Teklif Oluştur</h1>
            <p className="text-gray-600">Satış fırsatınız için profesyonel teklif hazırlayın</p>
          </div>
        </div>
        <Button
          onClick={onBackToDashboard}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <X className="h-4 w-4" />
          <span>İptal</span>
        </Button>
      </div>

      {/* Teklif Konusu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Teklif Konusu</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satış Fırsatı Seçin *
              </label>
              <select
                value={formData.teklifKonusu}
                onChange={(e) => handleTeklifKonusuChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Satış fırsatı seçiniz...</option>
                {satisFirsatlari.map(firsat => (
                  <option key={firsat.id} value={firsat.id}>
                    {firsat.firsatBasligi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri
              </label>
              <input
                type="text"
                value={musteriler.find(m => m.id === formData.musteriId)?.ad || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yetkili Kişiler */}
      {formData.musteriId && yetkiliKisiler.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Yetkili Kişiler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yetkili Kişi Seçin
              </label>
              <select
                onChange={(e) => e.target.value && handleYetkiliKisiEkle(e.target.value)}
                value=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Yetkili kişi seçiniz...</option>
                {yetkiliKisiler
                  .filter(kisi => !formData.yetkiliKisiler.find(y => y.id === kisi.id))
                  .map(kisi => (
                    <option key={kisi.id} value={kisi.id}>
                      {kisi.ad} {kisi.soyad}
                    </option>
                  ))}
              </select>
            </div>
            
            {/* Seçilen Yetkili Kişiler */}
            {formData.yetkiliKisiler.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Seçilen Yetkili Kişiler:
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.yetkiliKisiler.map(kisi => (
                    <div
                      key={kisi.id}
                      className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 flex items-center space-x-2"
                    >
                      <span className="font-medium text-gray-900">
                        {kisi.ad} {kisi.soyad}
                      </span>
                      <button
                        onClick={() => handleYetkiliKisiCikar(kisi.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tarih ve Konum Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Tarih ve Konum Bilgileri</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teklif Tarihi
              </label>
              <input
                type="date"
                value={formData.teklifTarihi}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuar Tarihi
              </label>
              <input
                type="text"
                value={formData.fuarTarihi}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuar Merkezi
              </label>
              <input
                type="text"
                value={formData.fuarMerkezi}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şehir
              </label>
              <input
                type="text"
                value={formData.sehir}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ülke
              </label>
              <input
                type="text"
                value={formData.ulke}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şablon Seçin
              </label>
              <select
                value={formData.sablon}
                onChange={(e) => setFormData(prev => ({ ...prev, sablon: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Şablon seçiniz...</option>
                {sablonlar.map(sablon => (
                  <option key={sablon.id} value={sablon.id}>
                    {sablon.ad}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vade Sistemi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Ödeme Vadesi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.vadeler.map((vade, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <span className="font-medium text-gray-700 min-w-[80px]">
                {index + 1}. Vade:
              </span>
              <select
                value={vade.tip}
                onChange={(e) => handleVadeChange(index, 'tip', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Ödeme zamanı seçiniz...</option>
                {vadeSecenekleri.map(secenek => (
                  <option key={secenek} value={secenek}>
                    {secenek}
                  </option>
                ))}
              </select>
              
              {vade.tip === 'Özel Tarih' && (
                <input
                  type="date"
                  value={vade.ozelTarih}
                  onChange={(e) => handleVadeChange(index, 'ozelTarih', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              <input
                type="number"
                placeholder="%"
                value={vade.yuzde}
                onChange={(e) => handleVadeChange(index, 'yuzde', e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={handleVadeEkle}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {formData.vadeler.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => handleVadeSil(index)}
                    size="sm"
                    variant="destructive"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          onClick={onBackToDashboard}
          variant="outline"
        >
          <X className="h-4 w-4 mr-2" />
          İptal
        </Button>
        <div className="space-x-3">
          <Button
            variant="outline"
            onClick={() => console.log('Taslak kaydet')}
          >
            <Save className="h-4 w-4 mr-2" />
            Taslak Kaydet
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => console.log('Teklif oluştur')}
          >
            <Check className="h-4 w-4 mr-2" />
            Teklif Oluştur
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeklifForm;