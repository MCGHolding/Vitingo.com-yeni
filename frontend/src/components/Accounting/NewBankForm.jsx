import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Globe, Save, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const NewBankForm = ({ onBackToDashboard }) => {
  const [formData, setFormData] = useState({
    companyId: '',
    companyName: '',
    country: '',
    bankName: '',
    // Turkey/UAE fields
    swiftCode: '',
    iban: '',
    branchName: '',
    branchCode: '',
    accountHolder: '',
    accountNumber: '',
    // USA fields
    routingNumber: '',
    usAccountNumber: '',
    bankAddress: '',
    recipientAddress: '',
    recipientName: '',
    recipientZipCode: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [ibanError, setIbanError] = useState('');
  
  // Group companies
  const [groupCompanies, setGroupCompanies] = useState([]);
  
  // Country management
  const [countries, setCountries] = useState([]);
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [isAddingCountry, setIsAddingCountry] = useState(false);

  // Load countries from backend
  const loadCountries = async () => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/countries`);
      
      if (response.ok) {
        const countriesData = await response.json();
        setCountries(countriesData);
      } else {
        // Fallback to default countries
        setCountries([
          { code: 'Turkey', name: 'Türkiye', flag: '🇹🇷' },
          { code: 'UAE', name: 'BAE', flag: '🇦🇪' },
          { code: 'USA', name: 'ABD', flag: '🇺🇸' }
        ]);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      // Fallback to default countries
      setCountries([
        { code: 'Turkey', name: 'Türkiye', flag: '🇹🇷' },
        { code: 'UAE', name: 'BAE', flag: '🇦🇪' },
        { code: 'USA', name: 'ABD', flag: '🇺🇸' }
      ]);
    }
  };

  // Load group companies
  const loadGroupCompanies = async () => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/group-companies`);
      
      if (response.ok) {
        const companies = await response.json();
        setGroupCompanies(Array.isArray(companies) ? companies : []);
      }
    } catch (error) {
      console.error('Error loading group companies:', error);
    }
  };

  // Load countries and companies on component mount
  useEffect(() => {
    loadCountries();
    loadGroupCompanies();
  }, []);

  const handleAddCountry = async () => {
    if (!newCountryName.trim()) {
      alert('Ülke adı girilmelidir');
      return;
    }

    setIsAddingCountry(true);
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/countries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country_name: newCountryName })
      });

      if (response.ok) {
        await loadCountries(); // Reload countries
        setNewCountryName('');
        setShowAddCountryModal(false);
        alert('Ülke başarıyla eklendi');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ülke eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding country:', error);
      alert(`Ülke eklenemedi: ${error.message}`);
    } finally {
      setIsAddingCountry(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatIBAN = (value) => {
    // Remove all spaces and convert to uppercase
    const cleanValue = value.replace(/\s/g, '').toUpperCase();
    
    // Limit to 26 characters for Turkey
    const limitedValue = cleanValue.slice(0, 26);
    
    // Add spaces every 4 characters
    const formatted = limitedValue.replace(/(.{4})/g, '$1 ').trim();
    
    return formatted;
  };

  const validateIBAN = (iban) => {
    const cleanIban = iban.replace(/\s/g, '');
    
    // Check if starts with TR and has correct length (26 characters for Turkey)
    if (!cleanIban.startsWith('TR')) {
      return 'IBAN TR ile başlamalıdır';
    }
    
    if (cleanIban.length < 26) {
      return 'IBAN eksik - 26 karakter olmalıdır';
    }
    
    if (cleanIban.length > 26) {
      return 'IBAN çok uzun - 26 karakter olmalıdır';
    }
    
    // Check if contains only TR + numbers
    const numberPart = cleanIban.substring(2);
    if (!/^\d+$/.test(numberPart)) {
      return 'IBAN sadece TR ve rakamlardan oluşmalıdır';
    }
    
    return '';
  };

  const handleIBANChange = (value) => {
    const formattedValue = formatIBAN(value);
    setFormData(prev => ({ ...prev, iban: formattedValue }));
    
    const error = validateIBAN(formattedValue);
    setIbanError(error);
  };

  const handleCountryChange = (country) => {
    setFormData(prev => ({
      ...prev,
      country,
      // Clear country-specific fields when country changes
      swiftCode: '',
      iban: '',
      branchName: '',
      branchCode: '',
      accountHolder: '',
      accountNumber: '',
      routingNumber: '',
      usAccountNumber: '',
      bankAddress: '',
      recipientAddress: '',
      recipientName: '',
      recipientZipCode: ''
    }));
  };

  const validateForm = () => {
    if (!formData.country || !formData.bankName) {
      alert('Ülke ve banka adı gereklidir');
      return false;
    }

    if (formData.country === 'Turkey' || formData.country === 'UAE') {
      if (!formData.swiftCode || !formData.iban) {
        alert('SWIFT kodu ve IBAN gereklidir');
        return false;
      }
    } else if (formData.country === 'USA') {
      if (!formData.routingNumber || !formData.usAccountNumber) {
        alert('Routing Number ve Account Number gereklidir');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Prepare bank data based on country
      const bankData = {
        country: formData.country,
        bank_name: formData.bankName
      };

      if (formData.country === 'Turkey' || formData.country === 'UAE') {
        bankData.swift_code = formData.swiftCode;
        bankData.iban = formData.iban;
        bankData.branch_name = formData.branchName || null;
        bankData.branch_code = formData.branchCode || null;
        bankData.account_holder = formData.accountHolder || null;
        bankData.account_number = formData.accountNumber || null;
      } else if (formData.country === 'USA') {
        bankData.routing_number = formData.routingNumber;
        bankData.us_account_number = formData.usAccountNumber;
        bankData.bank_address = formData.bankAddress || null;
        bankData.recipient_address = formData.recipientAddress || null;
        bankData.recipient_name = formData.recipientName || null;
        bankData.recipient_zip_code = formData.recipientZipCode || null;
      }

      console.log('Sending bank data:', bankData);

      const response = await fetch(`${backendUrl}/api/banks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bankData)
      });

      if (response.ok) {
        const savedBank = await response.json();
        console.log('Bank saved successfully:', savedBank);
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Banka kaydedilirken hata oluştu');
      }
      
    } catch (error) {
      console.error('Error saving bank:', error);
      alert(`Banka kaydedilemedi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData({
      country: '',
      bankName: '',
      swiftCode: '',
      iban: '',
      branchName: '',
      branchCode: '',
      accountHolder: '',
      accountNumber: '',
      routingNumber: '',
      usAccountNumber: '',
      bankAddress: '',
      recipientAddress: '',
      recipientName: '',
      recipientZipCode: ''
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Building2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Banka</h1>
            <p className="text-gray-600">Banka bilgilerini ekleyin</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onBackToDashboard}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Geri Dön</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Group Company Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">Grup Şirketi Seçimi</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grup Şirketi *
            </label>
            <Select 
              value={formData.companyId} 
              onValueChange={(value) => {
                const selectedCompany = groupCompanies.find(c => c.id === value);
                
                // Map country names to country codes
                const countryMapping = {
                  'Türkiye': 'Turkey',
                  'ABD': 'USA',
                  'Birleşik Arap Emirlikleri': 'UAE',
                  'Turkey': 'Turkey',
                  'USA': 'USA',
                  'UAE': 'UAE'
                };
                
                const countryCode = countryMapping[selectedCompany?.country] || selectedCompany?.country || '';
                
                console.log('Selected company:', selectedCompany?.name);
                console.log('Company country:', selectedCompany?.country);
                console.log('Mapped country code:', countryCode);
                
                setFormData({
                  ...formData,
                  companyId: value,
                  companyName: selectedCompany?.name || '',
                  country: countryCode
                });
              }}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Grup şirketi seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {groupCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Country Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">Ülke Seçimi</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddCountryModal(true)}
              className="flex items-center space-x-1 text-green-600 border-green-200 hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />
              <span>Ülke Ekle</span>
            </Button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ülke * 
              <span className="text-xs text-gray-500 ml-2">(Grup şirketine göre otomatik belirlenir)</span>
            </label>
            {formData.companyId ? (
              <div className="h-12 px-4 py-2 bg-gray-50 border border-gray-300 rounded-md flex items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {formData.country === 'Turkey' && '🇹🇷'}
                    {formData.country === 'USA' && '🇺🇸'}
                    {formData.country === 'UAE' && '🇦🇪'}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formData.country === 'Turkey' && 'Türkiye'}
                    {formData.country === 'USA' && 'ABD'}
                    {formData.country === 'UAE' && 'BAE'}
                    {!formData.country && 'Ülke belirleniyor...'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-12 px-4 py-2 bg-gray-100 border border-gray-300 rounded-md flex items-center text-gray-500">
                Önce grup şirketi seçin
              </div>
            )}
          </div>
        </div>

        {/* Bank Information */}
        {formData.country && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">Banka Bilgileri</h3>
            </div>

            {/* Common field - Bank Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banka Adı *
              </label>
              <Input
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                placeholder={
                  formData.country === 'Turkey' ? 'Örn: Garanti BBVA' :
                  formData.country === 'UAE' ? 'Örn: Emirates Islamic Bank' :
                  formData.country === 'USA' ? 'Örn: Chase Bank' : 'Banka adını giriniz'
                }
                className="w-full"
                required
              />
            </div>

            {/* Turkey/UAE Fields */}
            {(formData.country === 'Turkey' || formData.country === 'UAE') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SWIFT Kodu *
                  </label>
                  <Input
                    value={formData.swiftCode}
                    onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                    placeholder={
                      formData.country === 'Turkey' ? 'Örn: TGBATRIS' : 'Örn: EIBKAEADXXX'
                    }
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN *
                  </label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => handleIBANChange(e.target.value)}
                    placeholder={
                      formData.country === 'Turkey' ? 
                      'Örn: TR32 0006 2000 0000 0006 2958 16' : 
                      'Örn: AE07 0331 2345 6789 0123 456'
                    }
                    className="w-full"
                    required
                  />
                  {ibanError && (
                    <p className="text-xs text-red-600 mt-1">{ibanError}</p>
                  )}
                  {!ibanError && formData.country === 'Turkey' && (
                    <p className="text-xs text-gray-500 mt-1">Lütfen örneğe uygun şekilde giriş yapınız</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube Adı
                  </label>
                  <Input
                    value={formData.branchName}
                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                    placeholder={
                      formData.country === 'Turkey' ? 'Örn: Levent Şubesi' : 'Örn: Downtown Dubai Branch'
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube Kodu
                  </label>
                  <Input
                    value={formData.branchCode}
                    onChange={(e) => handleInputChange('branchCode', e.target.value)}
                    placeholder={
                      formData.country === 'Turkey' ? 'Örn: 620' : 'Örn: 033'
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hesap Sahibi
                  </label>
                  <Input
                    value={formData.accountHolder}
                    onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                    placeholder={
                      formData.country === 'Turkey' ? 
                      'Örn: Başarı Uluslararası Fuarcılık A.Ş.' : 
                      'Örn: Basari International Exhibition LLC'
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hesap Numarası
                  </label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder={
                      formData.country === 'Turkey' ? 'Örn: 6295816' : 'Örn: 1234567890123456'
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* USA Fields */}
            {formData.country === 'USA' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Number *
                  </label>
                  <Input
                    value={formData.routingNumber}
                    onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                    placeholder="Örn: 021000021 (Chase Bank)"
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <Input
                    value={formData.usAccountNumber}
                    onChange={(e) => handleInputChange('usAccountNumber', e.target.value)}
                    placeholder="Örn: 1234567890123456"
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banka Adresi
                  </label>
                  <Input
                    value={formData.bankAddress}
                    onChange={(e) => handleInputChange('bankAddress', e.target.value)}
                    placeholder="Örn: 383 Madison Ave, New York, NY 10179"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alıcı Adresi
                  </label>
                  <Input
                    value={formData.recipientAddress}
                    onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                    placeholder="Örn: 123 Business St, New York, NY 10001"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alıcı İsmi
                  </label>
                  <Input
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    placeholder="Örn: Basari International LLC"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alıcı Zip Code
                  </label>
                  <Input
                    value={formData.recipientZipCode}
                    onChange={(e) => handleInputChange('recipientZipCode', e.target.value)}
                    placeholder="Örn: 10001"
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        {formData.country && (
          <div className="flex justify-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              className="px-8 py-3"
            >
              Temizle
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              <Save className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Kaydediliyor...' : 'Bankayı Ekle'}
            </Button>
          </div>
        )}
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🎉 Başarılı!</h3>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 text-base leading-relaxed">
                <strong>Yeni banka başarıyla eklendi!</strong>
                <br /><br />
                Banka bilgileriniz sisteme kaydedilmiştir.
                <br />
                <span className="font-bold text-green-600">Tüm Bankalar</span> bölümünden görüntüleyebilirsiniz.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  onBackToDashboard();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
              >
                📊 Dashboard'a Dön
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  clearForm();
                }}
                variant="outline"
                className="flex-1 py-3"
              >
                ➕ Yeni Banka
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Country Modal */}
      {showAddCountryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Yeni Ülke Ekle</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ülke Adı *
              </label>
              <Input
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
                placeholder="Örn: Almanya, Fransa, İtalya"
                className="w-full"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCountry();
                  }
                }}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowAddCountryModal(false);
                  setNewCountryName('');
                }}
                variant="outline"
                className="flex-1 py-3"
                disabled={isAddingCountry}
              >
                İptal
              </Button>
              <Button
                onClick={handleAddCountry}
                disabled={isAddingCountry || !newCountryName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingCountry ? 'Ekleniyor...' : 'Ülke Ekle'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBankForm;