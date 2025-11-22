import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function NewFairFormSimple({ onClose }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showBulkCityModal, setShowBulkCityModal] = useState(false);
  const [bulkCityText, setBulkCityText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    fuarAdi: '',
    fuarSenesi: new Date().getFullYear().toString(),
    ulke: '',
    sehir: '',
    fuarMerkezi: '',
    baslamaTarihi: '',
    bitisTarihi: '',
    dongu: '',
    fuarAyi: ''
  });

  // Data states
  const [ulkeler, setUlkeler] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  const [tumUlkeler, setTumUlkeler] = useState([]); // For filtering cities
  const [fuarMerkezleri, setFuarMerkezleri] = useState([]);
  const [tumFuarMerkezleri, setTumFuarMerkezleri] = useState([]); // For filtering fair centers

  // Yıllar listesi (2025-2050)
  const yillar = Array.from({ length: 26 }, (_, i) => 2025 + i);

  // Döngü seçenekleri
  const donguler = [
    { value: '6_months', label: '6 ayda bir' },
    { value: 'yearly', label: 'Her yıl' },
    { value: '2_years', label: '2 yılda bir' },
    { value: '3_years', label: '3 yılda bir' }
  ];

  // Aylar
  const aylar = [
    { value: '01', label: 'Ocak' },
    { value: '02', label: 'Şubat' },
    { value: '03', label: 'Mart' },
    { value: '04', label: 'Nisan' },
    { value: '05', label: 'Mayıs' },
    { value: '06', label: 'Haziran' },
    { value: '07', label: 'Temmuz' },
    { value: '08', label: 'Ağustos' },
    { value: '09', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ];

  // Load countries from library
  useEffect(() => {
    const loadUlkeler = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/library/countries`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const ulkeIsimleri = data.map(d => d.name).filter(n => n).sort();
          setUlkeler(ulkeIsimleri);
          setTumUlkeler(data);
        }
      } catch (error) {
        console.error('Ülkeler yüklenemedi:', error);
      }
    };

    loadUlkeler();
  }, []);

  // Filter cities when country changes
  useEffect(() => {
    if (formData.ulke && tumUlkeler.length > 0) {
      const secilenUlke = tumUlkeler.find(u => u.name === formData.ulke);
      
      if (secilenUlke && secilenUlke.cities) {
        const sehirListesi = [...new Set(secilenUlke.cities.filter(c => c))].sort();
        setSehirler(sehirListesi);
      } else {
        setSehirler([]);
      }
      
      // Reset city and fair center when country changes
      setFormData(prev => ({ ...prev, sehir: '', fuarMerkezi: '' }));
    } else {
      setSehirler([]);
    }
  }, [formData.ulke, tumUlkeler]);

  // Load fair centers from library
  useEffect(() => {
    const loadFuarMerkezleri = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/library/fair-centers`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setTumFuarMerkezleri(data);
        }
      } catch (error) {
        console.error('Fuar merkezleri yüklenemedi:', error);
      }
    };

    loadFuarMerkezleri();
  }, []);

  // Filter fair centers when city changes
  useEffect(() => {
    if (formData.sehir && tumFuarMerkezleri.length > 0) {
      const sehirMerkezleri = tumFuarMerkezleri.filter(m => m.city === formData.sehir);
      
      if (sehirMerkezleri.length > 0) {
        const merkezIsimleri = [...new Set(sehirMerkezleri.map(m => m.name).filter(n => n))].sort();
        setFuarMerkezleri(merkezIsimleri);
      } else {
        setFuarMerkezleri([]);
      }
      
      // Reset fair center when city changes
      setFormData(prev => ({ ...prev, fuarMerkezi: '' }));
    } else {
      setFuarMerkezleri([]);
    }
  }, [formData.sehir, tumFuarMerkezleri]);

  const handleBulkCityAdd = async () => {
    if (!formData.ulke) {
      toast({
        title: "Uyarı",
        description: "Lütfen önce bir ülke seçin.",
        variant: "destructive"
      });
      return;
    }

    if (!bulkCityText.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen şehir isimlerini girin.",
        variant: "destructive"
      });
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Parse cities from text (one per line)
      const yeniSehirler = bulkCityText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (yeniSehirler.length === 0) {
        toast({
          title: "Uyarı",
          description: "Geçerli şehir bulunamadı.",
          variant: "destructive"
        });
        return;
      }

      // Find country in database
      const response = await fetch(`${backendUrl}/api/library/countries`);
      const ulkelerData = await response.json();
      const secilenUlke = ulkelerData.find(u => u.name === formData.ulke);

      if (!secilenUlke) {
        toast({
          title: "Hata",
          description: "Ülke bulunamadı.",
          variant: "destructive"
        });
        return;
      }

      // Merge new cities with existing ones (avoid duplicates)
      const mevcutSehirler = secilenUlke.cities || [];
      const tumSehirler = [...new Set([...mevcutSehirler, ...yeniSehirler])];

      // Update country with new cities
      const updateResponse = await fetch(`${backendUrl}/api/library/countries/${secilenUlke.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...secilenUlke,
          cities: tumSehirler
        })
      });

      if (updateResponse.ok) {
        toast({
          title: "Başarılı!",
          description: `${yeniSehirler.length} şehir eklendi.`
        });

        // Refresh countries data
        const yeniResponse = await fetch(`${backendUrl}/api/library/countries`);
        const yeniData = await yeniResponse.json();
        const ulkeIsimleri = yeniData.map(d => d.name).filter(n => n).sort();
        setUlkeler(ulkeIsimleri);
        setTumUlkeler(yeniData);

        // Update cities list for selected country
        const guncelUlke = yeniData.find(u => u.name === formData.ulke);
        if (guncelUlke && guncelUlke.cities) {
          const sehirListesi = [...new Set(guncelUlke.cities.filter(c => c))].sort();
          setSehirler(sehirListesi);
        }

        // Close modal and reset
        setShowBulkCityModal(false);
        setBulkCityText('');
      } else {
        throw new Error('Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Hata:', error);
      toast({
        title: "Hata",
        description: "Şehirler eklenemedi.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.fuarAdi || !formData.fuarSenesi || !formData.ulke || !formData.sehir ||
        !formData.baslamaTarihi || !formData.bitisTarihi || !formData.dongu || !formData.fuarAyi) {
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const fuarData = {
        name: formData.fuarAdi,
        year: formData.fuarSenesi,
        country: formData.ulke,
        city: formData.sehir,
        fairCenter: formData.fuarMerkezi || '',
        startDate: formData.baslamaTarihi,
        endDate: formData.bitisTarihi,
        cycle: formData.dongu,
        fairMonth: formData.fuarAyi,
        sector: 'Genel',
        description: `${formData.fuarAdi} - ${formData.fuarSenesi}`
      };

      const response = await fetch(`${backendUrl}/api/fairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fuarData)
      });

      if (response.ok) {
        toast({
          title: "Başarılı!",
          description: `${formData.fuarAdi} fuarı kaydedildi.`
        });
        
        // Reset form
        setFormData({
          fuarAdi: '',
          fuarSenesi: new Date().getFullYear().toString(),
          ulke: '',
          sehir: '',
          fuarMerkezi: '',
          baslamaTarihi: '',
          bitisTarihi: '',
          dongu: '',
          fuarAyi: ''
        });

        if (onClose) {
          setTimeout(() => onClose(), 1500);
        }
      } else {
        throw new Error('Kayıt başarısız');
      }
    } catch (error) {
      console.error('Hata:', error);
      toast({
        title: "Hata",
        description: "Fuar kaydedilemedi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center">
        {onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">Yeni Fuar Ekle</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Fuar Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Fuar Adı ve Fuar Senesi */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fuar Adı <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.fuarAdi}
                  onChange={(e) => setFormData({ ...formData, fuarAdi: e.target.value })}
                  placeholder="Örn: Teknoloji Fuarı 2025"
                  className="h-12"
                />
              </div>

              {/* Fuar Senesi */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fuar Senesi <span className="text-red-500">*</span>
                </label>
                <Select value={formData.fuarSenesi} onValueChange={(value) => setFormData({ ...formData, fuarSenesi: value })}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sene seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {yillar.map((yil, idx) => (
                      <SelectItem key={`year-${idx}`} value={yil.toString()}>
                        {yil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ülke ve Şehir */}
            <div className="grid grid-cols-2 gap-4">
              {/* Ülke */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  <span>Ülke <span className="text-red-500">*</span></span>
                  {formData.ulke && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkCityModal(true)}
                      className="text-xs h-7"
                    >
                      Toplu İçeri At
                    </Button>
                  )}
                </label>
                <Select value={formData.ulke} onValueChange={(value) => setFormData({ ...formData, ulke: value })}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Ülke seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {ulkeler.map((ulke, idx) => (
                      <SelectItem key={`country-${idx}`} value={ulke}>
                        {ulke}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Şehir */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Şehir <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={formData.sehir} 
                  onValueChange={(value) => setFormData({ ...formData, sehir: value })}
                  disabled={!formData.ulke}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={formData.ulke ? "Şehir seçiniz" : "Önce ülke seçiniz"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sehirler.map((sehir, idx) => (
                      <SelectItem key={`city-${idx}`} value={sehir}>
                        {sehir}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fuar Merkezi */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Fuar Merkezi
              </label>
              <Select 
                value={formData.fuarMerkezi} 
                onValueChange={(value) => setFormData({ ...formData, fuarMerkezi: value })}
                disabled={!formData.sehir}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={formData.sehir ? "Fuar merkezi seçiniz (opsiyonel)" : "Önce şehir seçiniz"} />
                </SelectTrigger>
                <SelectContent>
                  {fuarMerkezleri.length > 0 ? (
                    fuarMerkezleri.map((merkez, idx) => (
                      <SelectItem key={`center-${idx}`} value={merkez}>
                        {merkez}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      {formData.sehir ? "Bu şehir için kayıtlı fuar merkezi yok" : "Önce şehir seçiniz"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Fuar Tarihleri */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Başlangıç Tarihi <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.baslamaTarihi}
                  onChange={(e) => setFormData({ ...formData, baslamaTarihi: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Bitiş Tarihi <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.bitisTarihi}
                  onChange={(e) => setFormData({ ...formData, bitisTarihi: e.target.value })}
                  min={formData.baslamaTarihi || undefined}
                  className="h-12"
                />
              </div>
            </div>

            {/* Döngü */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Döngü <span className="text-red-500">*</span>
              </label>
              <Select value={formData.dongu} onValueChange={(value) => setFormData({ ...formData, dongu: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Döngü seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {donguler.map((dongu, idx) => (
                    <SelectItem key={`cycle-${idx}`} value={dongu.value}>
                      {dongu.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fuar Ayı */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Fuar Ayı <span className="text-red-500">*</span>
              </label>
              <Select value={formData.fuarAyi} onValueChange={(value) => setFormData({ ...formData, fuarAyi: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Ay seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {aylar.map((ay, idx) => (
                    <SelectItem key={`month-${idx}`} value={ay.value}>
                      {ay.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end space-x-3">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              İptal
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Kaydediliyor...' : 'Fuarı Kaydet'}
          </Button>
        </div>
      </form>

      {/* Bulk City Add Modal */}
      {showBulkCityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Toplu Şehir Ekle - {formData.ulke}
                </h2>
                <button
                  onClick={() => {
                    setShowBulkCityModal(false);
                    setBulkCityText('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Şehir İsimleri (Her satıra bir şehir)
                  </label>
                  <textarea
                    value={bulkCityText}
                    onChange={(e) => setBulkCityText(e.target.value)}
                    placeholder="İstanbul&#10;Ankara&#10;İzmir&#10;..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Her satıra bir şehir ismi yazın. Mevcut şehirler otomatik olarak atlanacaktır.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowBulkCityModal(false);
                      setBulkCityText('');
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBulkCityAdd}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Şehirleri Ekle
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
