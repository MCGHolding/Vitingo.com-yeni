import React, { useState } from 'react';
import { X, Plus, Calendar, Check, Minus, Edit, Save, FileText, Users, Building } from 'lucide-react';

const SimpleTeklifForm = ({ onBackToDashboard }) => {
  const [formData, setFormData] = useState({
    teklifKonusu: '',
    musteriId: '',
    yetkiliKisiler: [],
    teklifTarihi: new Date().toISOString().split('T')[0],
    fuarTarihi: '',
    fuarMerkezi: '',
    sehir: '',
    ulke: '',
    sablon: ''
  });

  // Mock data
  const satisFirsatlari = [
    { id: '1', firsatBasligi: 'ITU Fuarı 2024 Stand Projesi', musteriId: '1', fuarTarihi: '2024-12-15', fuarMerkezi: 'Istanbul Fuar Merkezi', sehir: 'İstanbul', ulke: 'Türkiye' },
    { id: '2', firsatBasligi: 'Hannover Messe 2024', musteriId: '2', fuarTarihi: '2024-11-20', fuarMerkezi: 'Hannover Exhibition Center', sehir: 'Hannover', ulke: 'Almanya' }
  ];

  const musteriler = [
    { id: '1', ad: 'Acme Corp' },
    { id: '2', ad: 'Tech Solutions' }
  ];

  const sablonlar = [
    { id: '1', ad: 'Standart Teklif Şablonu' },
    { id: '2', ad: 'Premium Teklif Şablonu' }
  ];

  const handleTeklifKonusuChange = (firsatId) => {
    const seciliFirsat = satisFirsatlari.find(f => f.id === firsatId);
    if (seciliFirsat) {
      setFormData(prev => ({
        ...prev,
        teklifKonusu: firsatId,
        musteriId: seciliFirsat.musteriId,
        fuarTarihi: seciliFirsat.fuarTarihi,
        fuarMerkezi: seciliFirsat.fuarMerkezi,
        sehir: seciliFirsat.sehir,
        ulke: seciliFirsat.ulke
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Teklif Oluştur</h1>
            <p className="text-gray-600">Satış fırsatınız için profesyonel teklif hazırlayın</p>
          </div>
        </div>
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          <span>İptal</span>
        </button>
      </div>

      {/* Teklif Konusu Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Teklif Konusu</span>
          </h3>
        </div>
        <div className="p-6">
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
        </div>
      </div>

      {/* Tarih ve Konum Bilgileri */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Tarih ve Konum Bilgileri</span>
          </h3>
        </div>
        <div className="p-6">
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
        </div>
      </div>

      {/* Ödeme Vadesi */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Ödeme Vadesi</span>
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <span className="font-medium text-gray-700 min-w-[80px]">1. Vade:</span>
              <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Ödeme zamanı seçiniz...</option>
                <option value="pesin">Peşin</option>
                <option value="kurulum">Kurulum İlk Günü</option>
                <option value="teslim">Fuar Teslim Günü</option>
                <option value="sokum">Fuar Söküm Günü</option>
                <option value="1hafta">Teslimden 1 hafta sonra</option>
                <option value="2hafta">Teslimden 2 hafta sonra</option>
                <option value="1ay">Teslimden 1 ay sonra</option>
                <option value="ozel">Özel Tarih</option>
              </select>
              <input
                type="number"
                placeholder="%"
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          <span>İptal</span>
        </button>
        <div className="space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Save className="h-4 w-4" />
            <span>Taslak Kaydet</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Check className="h-4 w-4" />
            <span>Teklif Oluştur</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTeklifForm;