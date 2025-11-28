import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Building2, Plus, MoreVertical, Settings, Check, Trash2, Edit, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Predefined color palettes
const COLOR_PALETTES = [
  { name: 'Kurumsal Mavi', primary: '#1a73e8', secondary: '#34a853', accent: '#fbbc04' },
  { name: 'Elegance Siyah', primary: '#2c3e50', secondary: '#95a5a6', accent: '#e74c3c' },
  { name: 'Nature Yeşil', primary: '#27ae60', secondary: '#2ecc71', accent: '#f39c12' },
  { name: 'Warm Orange', primary: '#e67e22', secondary: '#d35400', accent: '#c0392b' },
  { name: 'Royal Purple', primary: '#8e44ad', secondary: '#9b59b6', accent: '#3498db' },
  { name: 'Modern Gri', primary: '#34495e', secondary: '#7f8c8d', accent: '#16a085' },
  { name: 'Ocean Teal', primary: '#16a085', secondary: '#1abc9c', accent: '#3498db' },
  { name: 'Sunset Red', primary: '#e74c3c', secondary: '#c0392b', accent: '#f39c12' }
];

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' }
];

const ProposalProfilesPage = ({ onBackToDashboard }) => {
  const [profiles, setProfiles] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [companyGroups, setCompanyGroups] = useState([]);
  const [selectedGroupCompanies, setSelectedGroupCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    profile_name: '',
    company_group_id: '',
    selected_company_id: '',
    company_info: {
      name: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      tax_office: '',
      tax_number: ''
    },
    branding: {
      logo_url: '',
      primary_color: '#1a73e8',
      secondary_color: '#34a853',
      accent_color: '#fbbc04'
    },
    defaults: {
      page_orientation: 'portrait',
      currency: 'TRY',
      language: 'tr',
      validity_days: 30,
      payment_terms: ''
    },
    is_default: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProfiles();
    loadCurrencies();
    loadCompanyGroups();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/proposal-profiles?user_id=demo-user`);
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/currencies`);
      const data = await response.json();
      setCurrencies(data);
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const applyColorPalette = (palette) => {
    setFormData(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        primary_color: palette.primary,
        secondary_color: palette.secondary,
        accent_color: palette.accent
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.profile_name || formData.profile_name.length < 3) {
      newErrors.profile_name = 'Profil adı en az 3 karakter olmalıdır';
    }
    
    if (!formData.company_info.name) {
      newErrors['company_info.name'] = 'Firma adı zorunludur';
    }
    
    if (formData.company_info.email && !isValidEmail(formData.company_info.email)) {
      newErrors['company_info.email'] = 'Geçersiz e-posta formatı';
    }
    
    if (formData.company_info.website && !isValidUrl(formData.company_info.website)) {
      newErrors['company_info.website'] = 'Geçersiz URL formatı';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        ...formData,
        user_id: 'demo-user'
      };

      const url = editingProfile 
        ? `${BACKEND_URL}/api/proposal-profiles/${editingProfile.id}`
        : `${BACKEND_URL}/api/proposal-profiles`;
      
      const method = editingProfile ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Kaydedilemedi');
      }

      // Success
      setShowSlideOver(false);
      setEditingProfile(null);
      resetForm();
      loadProfiles();
      
      // Show success toast
      alert(`Profil başarıyla ${editingProfile ? 'güncellendi' : 'oluşturuldu'}!`);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Bir hata oluştu: ' + error.message);
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      profile_name: profile.profile_name,
      company_info: profile.company_info,
      branding: profile.branding || {
        logo_url: '',
        primary_color: '#1a73e8',
        secondary_color: '#34a853',
        accent_color: '#fbbc04'
      },
      defaults: profile.defaults || {
        page_orientation: 'portrait',
        currency: 'TRY',
        language: 'tr',
        validity_days: 30,
        payment_terms: ''
      },
      is_default: profile.is_default
    });
    setShowSlideOver(true);
  };

  const handleDelete = async (profileId) => {
    if (!window.confirm('Bu profili silmek istediğinize emin misiniz? Bu profile bağlı teklifler etkilenmeyecek.')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/proposal-profiles/${profileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Silinemedi');
      }

      loadProfiles();
      alert('Profil silindi');
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Silme hatası: ' + error.message);
    }
  };

  const handleSetDefault = async (profileId) => {
    try {
      // Update profile to set is_default
      const profile = profiles.find(p => p.id === profileId);
      const response = await fetch(`${BACKEND_URL}/api/proposal-profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, is_default: true })
      });

      if (!response.ok) {
        throw new Error('Güncellenemedi');
      }

      loadProfiles();
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      profile_name: '',
      company_info: {
        name: '',
        address: '',
        city: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        tax_office: '',
        tax_number: ''
      },
      branding: {
        logo_url: '',
        primary_color: '#1a73e8',
        secondary_color: '#34a853',
        accent_color: '#fbbc04'
      },
      defaults: {
        page_orientation: 'portrait',
        currency: 'TRY',
        language: 'tr',
        validity_days: 30,
        payment_terms: ''
      },
      is_default: false
    });
    setErrors({});
  };

  const getCurrencySymbol = (code) => {
    const currency = currencies.find(c => c.code === code);
    return currency ? currency.symbol : code;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teklif Profilleri</h1>
            <p className="text-gray-600 mt-1">{profiles.length} profil bulundu</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingProfile(null);
              setShowSlideOver(true);
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Profil</span>
          </Button>
        </div>

        {/* Profiles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Profiller yükleniyor...</p>
          </div>
        ) : profiles.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Henüz Profil Oluşturulmamış
                </h3>
                <p className="text-gray-500 mb-6">
                  Teklif oluşturmaya başlamak için ilk profilinizi oluşturun
                </p>
                <Button onClick={() => setShowSlideOver(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Profilinizi Oluşturun
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Card key={profile.id} className="relative hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {profile.branding?.logo_url ? (
                        <img 
                          src={profile.branding.logo_url} 
                          alt="Logo" 
                          className="h-12 w-12 object-contain"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{profile.profile_name}</h3>
                        <p className="text-sm text-gray-600">{profile.company_info.name}</p>
                      </div>
                    </div>
                    
                    {/* 3-dot menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === profile.id ? null : profile.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </button>
                      
                      {openMenuId === profile.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <button
                            onClick={() => {
                              handleEdit(profile);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Düzenle</span>
                          </button>
                          {!profile.is_default && (
                            <button
                              onClick={() => {
                                handleSetDefault(profile.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Check className="h-4 w-4" />
                              <span>Varsayılan Yap</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleDelete(profile.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Sil</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Color palette preview */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div 
                      className="h-6 w-6 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: profile.branding?.primary_color || '#1a73e8' }}
                    />
                    <div 
                      className="h-6 w-6 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: profile.branding?.secondary_color || '#34a853' }}
                    />
                    <div 
                      className="h-6 w-6 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: profile.branding?.accent_color || '#fbbc04' }}
                    />
                    
                    <span className="text-sm text-gray-600 ml-2">
                      {getCurrencySymbol(profile.defaults?.currency || 'TRY')} {profile.defaults?.currency || 'TRY'}
                    </span>
                  </div>
                  
                  {/* Default badge */}
                  {profile.is_default && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Varsayılan
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back button */}
        <div className="mt-8">
          <Button variant="outline" onClick={onBackToDashboard}>
            Dashboard'a Dön
          </Button>
        </div>
      </div>

      {/* Slide-over Panel - Will be added in next part */}
      {showSlideOver && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowSlideOver(false)}
            />
            
            {/* Panel */}
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-2xl">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  {/* Header */}
                  <div className="px-6 py-6 bg-gray-50 border-b">
                    <div className="flex items-start justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {editingProfile ? 'Profil Düzenle' : 'Yeni Teklif Profili'}
                      </h2>
                      <button
                        onClick={() => setShowSlideOver(false)}
                        className="rounded-md text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="flex-1 px-6 py-6 space-y-8">
                    
                    {/* Section 1: Basic Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profil Adı *
                          </label>
                          <input
                            type="text"
                            value={formData.profile_name}
                            onChange={(e) => handleInputChange('profile_name', e.target.value)}
                            placeholder="Ana Firma Profili"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {errors.profile_name && (
                            <p className="text-red-600 text-sm mt-1">{errors.profile_name}</p>
                          )}
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.is_default}
                            onChange={(e) => handleInputChange('is_default', e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            Bu profili varsayılan olarak ayarla
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Company Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Firma Bilgileri</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Firma Adı *
                          </label>
                          <input
                            type="text"
                            value={formData.company_info.name}
                            onChange={(e) => handleInputChange('company_info.name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                          {errors['company_info.name'] && (
                            <p className="text-red-600 text-sm mt-1">{errors['company_info.name']}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                          <textarea
                            value={formData.company_info.address}
                            onChange={(e) => handleInputChange('company_info.address', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                            <input
                              type="text"
                              value={formData.company_info.city}
                              onChange={(e) => handleInputChange('company_info.city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                            <input
                              type="text"
                              value={formData.company_info.country}
                              onChange={(e) => handleInputChange('company_info.country', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                            <input
                              type="text"
                              value={formData.company_info.phone}
                              onChange={(e) => handleInputChange('company_info.phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                            <input
                              type="email"
                              value={formData.company_info.email}
                              onChange={(e) => handleInputChange('company_info.email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                            {errors['company_info.email'] && (
                              <p className="text-red-600 text-sm mt-1">{errors['company_info.email']}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                          <input
                            type="text"
                            value={formData.company_info.website}
                            onChange={(e) => handleInputChange('company_info.website', e.target.value)}
                            placeholder="www.example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                          {errors['company_info.website'] && (
                            <p className="text-red-600 text-sm mt-1">{errors['company_info.website']}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                            <input
                              type="text"
                              value={formData.company_info.tax_office}
                              onChange={(e) => handleInputChange('company_info.tax_office', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Numarası</label>
                            <input
                              type="text"
                              value={formData.company_info.tax_number}
                              onChange={(e) => handleInputChange('company_info.tax_number', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Branding */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Marka Kimliği</h3>
                      
                      {/* Color Pickers */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Renk Paleti</label>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Ana Renk</label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.branding.primary_color}
                                  onChange={(e) => handleInputChange('branding.primary_color', e.target.value)}
                                  className="h-10 w-16 border rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.branding.primary_color}
                                  onChange={(e) => handleInputChange('branding.primary_color', e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border rounded"
                                  placeholder="#1a73e8"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">İkincil Renk</label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.branding.secondary_color}
                                  onChange={(e) => handleInputChange('branding.secondary_color', e.target.value)}
                                  className="h-10 w-16 border rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.branding.secondary_color}
                                  onChange={(e) => handleInputChange('branding.secondary_color', e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border rounded"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Aksan Renk</label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.branding.accent_color}
                                  onChange={(e) => handleInputChange('branding.accent_color', e.target.value)}
                                  className="h-10 w-16 border rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.branding.accent_color}
                                  onChange={(e) => handleInputChange('branding.accent_color', e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border rounded"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Color Preview */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <p className="text-sm font-medium text-gray-700 mb-3">Renk Paletiniz Tekliflerde Böyle Görünecek</p>
                          <div className="bg-white rounded border overflow-hidden">
                            <div 
                              className="h-16 flex items-center px-4 text-white font-semibold"
                              style={{ backgroundColor: formData.branding.primary_color }}
                            >
                              {formData.company_info.name || 'FİRMA ADI'}
                            </div>
                            <div 
                              className="h-1"
                              style={{ backgroundColor: formData.branding.secondary_color }}
                            />
                            <div className="p-4">
                              <p className="text-gray-700 mb-2">Örnek başlık metni</p>
                              <button 
                                className="px-4 py-2 text-white text-sm rounded"
                                style={{ backgroundColor: formData.branding.accent_color }}
                              >
                                Detay Butonu
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Preset Palettes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hazır Paletler</label>
                          <div className="grid grid-cols-4 gap-2">
                            {COLOR_PALETTES.map((palette, idx) => (
                              <button
                                key={idx}
                                onClick={() => applyColorPalette(palette)}
                                className="border rounded p-2 hover:border-blue-500 transition-colors"
                                title={palette.name}
                              >
                                <div className="flex space-x-1 mb-1">
                                  <div className="h-6 flex-1 rounded" style={{ backgroundColor: palette.primary }} />
                                  <div className="h-6 flex-1 rounded" style={{ backgroundColor: palette.secondary }} />
                                  <div className="h-6 flex-1 rounded" style={{ backgroundColor: palette.accent }} />
                                </div>
                                <p className="text-xs text-gray-600 truncate">{palette.name}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Defaults */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Varsayılan Ayarlar</h3>
                      <div className="space-y-4">
                        
                        {/* Page Orientation */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sayfa Yönü</label>
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                value="portrait"
                                checked={formData.defaults.page_orientation === 'portrait'}
                                onChange={(e) => handleInputChange('defaults.page_orientation', e.target.value)}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">Dikey (Portrait)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                value="landscape"
                                checked={formData.defaults.page_orientation === 'landscape'}
                                onChange={(e) => handleInputChange('defaults.page_orientation', e.target.value)}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">Yatay (Landscape)</span>
                            </label>
                          </div>
                        </div>

                        {/* Currency */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                          <select
                            value={formData.defaults.currency}
                            onChange={(e) => handleInputChange('defaults.currency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <optgroup label="Popüler">
                              {currencies.filter(c => c.is_popular).map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.symbol} {c.code} - {c.name}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Diğer">
                              {currencies.filter(c => !c.is_popular).map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.symbol} {c.code} - {c.name}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>

                        {/* Language */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dil</label>
                          <select
                            value={formData.defaults.language}
                            onChange={(e) => handleInputChange('defaults.language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            {LANGUAGES.map(lang => (
                              <option key={lang.code} value={lang.code}>
                                {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Validity Days */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teklif Geçerlilik Süresi
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={formData.defaults.validity_days}
                              onChange={(e) => handleInputChange('defaults.validity_days', parseInt(e.target.value))}
                              min="1"
                              className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <span className="text-sm text-gray-600">gün</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Teklif gönderildikten sonra kaç gün geçerli olacak
                          </p>
                        </div>

                        {/* Payment Terms */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Varsayılan Ödeme Koşulları
                          </label>
                          <textarea
                            value={formData.defaults.payment_terms}
                            onChange={(e) => handleInputChange('defaults.payment_terms', e.target.value)}
                            rows={3}
                            placeholder="Örn: %50 sipariş onayında, %50 teslimatta"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowSlideOver(false)}
                    >
                      İptal
                    </Button>
                    <Button onClick={handleSave}>
                      Kaydet
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalProfilesPage;
