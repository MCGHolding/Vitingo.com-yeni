import React, { useState, useEffect } from 'react';
import { Phone, Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

const PhoneCodeManager = () => {
  const { toast } = useToast();
  const [phoneCodes, setPhoneCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    country: '',
    country_code: '',
    phone_code: '',
    flag: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  // Load phone codes
  const loadPhoneCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/phone-codes`);
      if (response.ok) {
        const data = await response.json();
        setPhoneCodes(data);
      }
    } catch (error) {
      console.error('Error loading phone codes:', error);
      toast({
        title: "Hata",
        description: "Telefon kodları yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhoneCodes();
  }, []);

  // Delete phone code
  const deletePhoneCode = async (id, country) => {
    if (!window.confirm(`${country} telefon kodunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/phone-codes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Telefon kodu silindi" });
        loadPhoneCodes();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({ 
        title: "Hata", 
        description: "Telefon kodu silinirken hata oluştu", 
        variant: "destructive" 
      });
    }
  };

  // Add phone code
  const handleAdd = async () => {
    if (!formData.country || !formData.country_code || !formData.phone_code) {
      toast({ 
        title: "Uyarı", 
        description: "Lütfen tüm alanları doldurun", 
        variant: "destructive" 
      });
      return;
    }

    // Check for duplicates
    const isDuplicate = phoneCodes.some(
      code => code.country_code === formData.country_code || code.country === formData.country
    );
    
    if (isDuplicate) {
      toast({ 
        title: "Uyarı", 
        description: "Bu ülke veya ülke kodu zaten mevcut!", 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/phone-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.country_code,
          ...formData
        })
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Telefon kodu eklendi" });
        setShowAddModal(false);
        setFormData({ country: '', country_code: '', phone_code: '', flag: '' });
        loadPhoneCodes();
      } else {
        throw new Error('Failed to add');
      }
    } catch (error) {
      toast({ 
        title: "Hata", 
        description: "Telefon kodu eklenirken hata oluştu", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update phone code
  const handleUpdate = async () => {
    if (!formData.country || !formData.country_code || !formData.phone_code) {
      toast({ 
        title: "Uyarı", 
        description: "Lütfen tüm alanları doldurun", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/phone-codes/${editingCode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCode.id,
          ...formData
        })
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Telefon kodu güncellendi" });
        setShowEditModal(false);
        setEditingCode(null);
        setFormData({ country: '', country_code: '', phone_code: '', flag: '' });
        loadPhoneCodes();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({ 
        title: "Hata", 
        description: "Telefon kodu güncellenirken hata oluştu", 
        variant: "destructive" 
      });
    }
  };

  // Filter phone codes
  const filteredCodes = phoneCodes.filter(code =>
    code.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.phone_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.country_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Phone className="h-6 w-6 mr-2 text-blue-600" />
              Telefon Kodları
            </h2>
            <p className="text-gray-600 mt-1">Ülke telefon kodlarını yönetin ({phoneCodes.length} kod)</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kod Ekle
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ülke, kod veya ülke kodu ara..."
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Phone Codes Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      ) : filteredCodes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Phone className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz telefon kodu eklenmemiş'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCodes.map((code) => (
            <Card key={code.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {code.flag && (
                        <span className="text-3xl">{code.flag}</span>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{code.country}</div>
                        <div className="text-sm text-gray-500">{code.country_code}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-lg font-bold text-blue-600">{code.phone_code}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setEditingCode(code);
                        setFormData({
                          country: code.country,
                          country_code: code.country_code,
                          phone_code: code.phone_code,
                          flag: code.flag || ''
                        });
                        setShowEditModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePhoneCode(code.id, code.country)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Yeni Telefon Kodu Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke Adı</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="Örn: Türkiye"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke Kodu</label>
                <Input
                  value={formData.country_code}
                  onChange={(e) => setFormData({...formData, country_code: e.target.value.toUpperCase()})}
                  placeholder="Örn: TR"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Kodu</label>
                <Input
                  value={formData.phone_code}
                  onChange={(e) => setFormData({...formData, phone_code: e.target.value})}
                  placeholder="Örn: +90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bayrak (Opsiyonel)</label>
                <Input
                  value={formData.flag}
                  onChange={(e) => setFormData({...formData, flag: e.target.value})}
                  placeholder="Örn: 🇹🇷"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ country: '', country_code: '', phone_code: '', flag: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Telefon Kodu Düzenle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke Adı</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="Örn: Türkiye"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke Kodu</label>
                <Input
                  value={formData.country_code}
                  onChange={(e) => setFormData({...formData, country_code: e.target.value.toUpperCase()})}
                  placeholder="Örn: TR"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Kodu</label>
                <Input
                  value={formData.phone_code}
                  onChange={(e) => setFormData({...formData, phone_code: e.target.value})}
                  placeholder="Örn: +90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bayrak (Opsiyonel)</label>
                <Input
                  value={formData.flag}
                  onChange={(e) => setFormData({...formData, flag: e.target.value})}
                  placeholder="Örn: 🇹🇷"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCode(null);
                  setFormData({ country: '', country_code: '', phone_code: '', flag: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneCodeManager;
